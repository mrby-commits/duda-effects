"""
把照片轉成「粗黑線稿 + 廟宇古舊配色」的插畫風格。

用法：
  tools/.venv/Scripts/python.exe -I tools/stylize.py 輸入.jpg 輸出.jpg [--colors 24] [--line 3]

步驟：
  1. 雙邊濾波平滑（保留邊緣、抹平細紋）
  2. k-means 色彩分群 → 每個色群做「做舊」：降彩度、暖色偏移、提亮暗部成深褐、混入宣紙色
  3. 結構線（Canny）去雜線後加粗，以墨色疊上
  4. 宣紙纖維紋理 + 暖褐暈影
"""
import argparse
import colorsys
import cv2
import numpy as np

INK = np.array([16, 20, 28], np.float32)        # BGR 墨色（偏暖的黑）
PAPER = np.array([196, 222, 236], np.float32)   # BGR 宣紙 #ecdec4
SEPIA = np.array([60, 95, 130], np.float32)     # BGR 暖褐（暈影）


def age_color(bgr, sat=0.72, warm=0.05, paper_mix=0.14, floor=0.16):
    """單一顏色做舊。bgr: 0-255 float"""
    b, g, r = (bgr / 255.0).tolist()
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    s *= sat
    v = floor + (1 - floor) * v                  # 暗部提成深褐，不要死黑
    # 往暖色（橘黃，約 0.08）偏一點
    dh = ((0.08 - h + 0.5) % 1.0) - 0.5
    h = (h + dh * warm) % 1.0
    # 天空、白牆這類亮且無彩的顏色 → 統一成宣紙色，畫面更乾淨
    if v > 0.82 and s < 0.12:
        return PAPER.copy()
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    out = np.array([b, g, r], np.float32) * 255
    # 暗色往深褐、亮色往宣紙混
    if v < 0.45:
        out = out * 0.82 + np.array([30, 45, 70], np.float32) * 0.18
    out = out * (1 - paper_mix) + PAPER * paper_mix
    return np.clip(out, 0, 255)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--colors", type=int, default=24)
    ap.add_argument("--line", type=int, default=3)
    ap.add_argument("--min-edge", type=int, default=70)
    ap.add_argument("--canny", default="45,120")
    ap.add_argument("--sat", type=float, default=0.72)
    ap.add_argument("--paper", type=float, default=0.14)
    ap.add_argument("--floor", type=float, default=0.16)
    ap.add_argument("--contrast", type=float, default=1.0)
    ap.add_argument("--ms", default="", help="以 mean-shift 平滑後再抽線，例如 12,30；空白=不用")
    args = ap.parse_args()

    img = cv2.imread(args.src)
    h, w = img.shape[:2]

    # 1) 平滑
    smooth = cv2.bilateralFilter(img, 9, 50, 7)
    smooth = cv2.bilateralFilter(smooth, 9, 50, 7)

    # 2) 分群 + 做舊
    lab = cv2.cvtColor(smooth, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(lab, args.colors, None, criteria, 2, cv2.KMEANS_PP_CENTERS)
    labels = cv2.medianBlur(labels.reshape(h, w).astype(np.uint8), 3)
    centers_bgr = cv2.cvtColor(centers.astype(np.uint8).reshape(-1, 1, 3), cv2.COLOR_LAB2BGR).reshape(-1, 3).astype(np.float32)
    if args.contrast != 1.0:
        centers_bgr = np.clip((centers_bgr - 128) * args.contrast + 128, 0, 255)
    aged = np.array([age_color(c, sat=args.sat, paper_mix=args.paper, floor=args.floor) for c in centers_bgr], np.float32)
    color = aged[labels]

    # 3) 粗黑線
    lo, hi = (int(x) for x in args.canny.split(","))
    line_src = smooth
    if args.ms:
        sp, sr = (int(x) for x in args.ms.split(","))
        line_src = cv2.pyrMeanShiftFiltering(smooth, sp, sr)
    gray = cv2.cvtColor(line_src, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, lo, hi, L2gradient=True)
    n, cc, stats, _ = cv2.connectedComponentsWithStats(edges, 8)
    keep = np.zeros(n, bool)
    keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= args.min_edge
    edges = (keep[cc] * 255).astype(np.uint8)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (args.line, args.line))
    edges = cv2.dilate(edges, k)
    # 模糊後再二值化：把鋸齒狀的線修成圓潤的筆觸
    soft = cv2.GaussianBlur(edges.astype(np.float32) / 255.0, (0, 0), 1.6)
    stroke = np.clip((soft - 0.42) * 6.0, 0, 1)
    alpha = cv2.GaussianBlur(stroke, (3, 3), 0)[..., None] * 0.96
    out = color * (1 - alpha) + INK * alpha

    # 4) 宣紙紋理 + 暈影
    rng = np.random.default_rng(7)
    grain = cv2.resize(cv2.GaussianBlur(rng.normal(0, 1, (h // 2, w // 2)).astype(np.float32), (0, 0), 1.0), (w, h))
    fiber = cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 7)
    out += (grain * 5 + fiber * 9)[..., None]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    vig = np.clip(1 - 0.35 * np.clip(r - 0.5, 0, None) ** 1.4, 0, 1)[..., None]
    out = out * vig + SEPIA * (1 - vig) * 0.7
    # 整體壓一層淡淡的暖褐，像放了很久的畫
    out = out * np.array([0.88, 0.94, 0.99], np.float32)

    out = np.clip(out, 0, 255).astype(np.uint8)
    cv2.imwrite(args.dst, out, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print("saved", args.dst, out.shape)


if __name__ == "__main__":
    main()

"""
首頁橫幅專用深度圖：左側標題裝飾區固定為同一深度（文字不變形），
右側廟宇與天空沿用 AI 深度。

用法：
  tools/.venv/Scripts/python.exe -I tools/hero_depth.py AI深度.png 輸出.jpg [--panel 0.40] [--feather 0.10] [--panel-depth 0.75]
"""
import argparse
import cv2
import numpy as np


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--panel", type=float, default=0.40, help="左側標題區寬度（佔全寬比例）")
    ap.add_argument("--feather", type=float, default=0.10, help="標題區邊緣漸層寬度")
    ap.add_argument("--panel-depth", type=float, default=0.75)
    ap.add_argument("--scene", default="0.05,0.55", help="廟宇/天空深度壓縮範圍")
    args = ap.parse_args()

    d = cv2.imread(args.src, 0).astype(np.float32) / 255.0
    h, w = d.shape
    lo, hi = (float(x) for x in args.scene.split(","))
    scene = lo + d * (hi - lo)

    x = np.arange(w, dtype=np.float32) / w
    a0, a1 = args.panel, args.panel + args.feather
    mask_x = np.clip((a1 - x) / (a1 - a0), 0, 1)  # 1 = 標題區
    mask = np.repeat(mask_x[None, :], h, axis=0)
    # 原深度中特別近的地方（左上樹葉等）也視為前景層
    near = np.clip((d - 0.75) / 0.15, 0, 1)
    mask = np.maximum(mask, near)
    mask = cv2.GaussianBlur(mask, (0, 0), 12)

    out = scene * (1 - mask) + args.panel_depth * mask
    out = cv2.GaussianBlur(out, (0, 0), 2)
    cv2.imwrite(args.dst, (np.clip(out, 0, 1) * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print("saved", args.dst, out.shape)


if __name__ == "__main__":
    main()

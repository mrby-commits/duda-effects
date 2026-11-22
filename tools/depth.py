"""
用 Depth Anything V2（Small, Apache-2.0）從單張照片估計深度圖。
輸出灰階 PNG：白 = 近、黑 = 遠。

用法：
  tools/.venv/Scripts/python.exe -I tools/depth.py 輸入.jpg 輸出.png [--guide 風格化圖.jpg]
"""
import argparse
import cv2
import numpy as np
import torch
from PIL import Image
from transformers import pipeline


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--model", default="depth-anything/Depth-Anything-V2-Small-hf")
    args = ap.parse_args()

    device = 0 if torch.cuda.is_available() else -1
    pipe = pipeline("depth-estimation", model=args.model, device=device)
    img = Image.open(args.src).convert("RGB")
    result = pipe(img)
    depth = np.array(result["predicted_depth"].squeeze().cpu(), dtype=np.float32)
    depth = cv2.resize(depth, img.size, interpolation=cv2.INTER_CUBIC)

    # 正規化（去掉極端值）
    lo, hi = np.percentile(depth, 1), np.percentile(depth, 99.5)
    d = np.clip((depth - lo) / (hi - lo), 0, 1)

    # 以原圖為導引做邊緣保留平滑，再對近處稍微擴張，減少視差時物體邊緣的拉扯
    guide = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    d8 = (d * 255).astype(np.uint8)
    d8 = cv2.bilateralFilter(d8, 9, 30, 9)
    d8 = cv2.dilate(d8, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    d8 = cv2.GaussianBlur(d8, (0, 0), 2.0)

    cv2.imwrite(args.dst, d8)
    print("saved", args.dst, d8.shape, "range", int(d8.min()), int(d8.max()))


if __name__ == "__main__":
    main()

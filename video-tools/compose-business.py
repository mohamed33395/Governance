#!/usr/bin/env python3
"""Silent business presentation: real screens plus Arabic captions."""

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/Users/amrmohamed/Documents/projects/Governance/video-tools")
SRC = ROOT / "output" / "business"
OUT = ROOT / "output" / "business-ready"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1440, 900
GREEN = "#1A412E"
CREAM = "#F6F4EE"
GOLD = "#C19B4A"
INK = "#1A412E"
WHITE = "#F7F4EE"

FONT = "/System/Library/Fonts/GeezaPro.ttc"
title_font = ImageFont.truetype(FONT, 64, index=0)
sub_font = ImageFont.truetype(FONT, 34, index=0)
cap_font = ImageFont.truetype(FONT, 32, index=0)
small_font = ImageFont.truetype(FONT, 24, index=0)


def text(draw, xy, value, font, fill, anchor="ra"):
    draw.text(xy, value, font=font, fill=fill, anchor=anchor, direction="rtl", language="ar")


def title_card(path, kicker, headline, lines):
    im = Image.new("RGB", (W, H), CREAM)
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, W, 18), fill=GREEN)
    draw.rectangle((0, H - 18, W, H), fill=GREEN)
    draw.rectangle((96, 250, 176, 258), fill=GOLD)
    text(draw, (W - 120, 290), kicker, small_font, GOLD)
    text(draw, (W - 120, 360), headline, title_font, GREEN)
    y = 470
    for line in lines:
        text(draw, (W - 120, y), line, sub_font, "#3d5348")
        y += 58
    im.save(path)


def caption_bar(path, lines):
    bar_h = 36 + 52 * len(lines)
    im = Image.new("RGBA", (W, bar_h + 28), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, W, bar_h + 28), fill=(26, 65, 46, 255))
    draw.rectangle((0, 0, W, 6), fill=GOLD)
    y = 28
    for line in lines:
        text(draw, (W - 72, y), line, cap_font, WHITE)
        y += 52
    im.save(path)


# start = seconds to skip (login screens). minimum = time the caption stays readable.
CLIPS = [
    ("home", 0, 16, ["من أول نظرة، العميل يفهم قيمة الخدمة", "ويشوف ماذا يحصل عليه عند الحجز"]),
    ("packages", 0, 16, ["باقات واضحة تناسب حجم المنشأة", "السعر والمدة والمميزات ظاهرة قبل الاختيار"]),
    ("consultants", 0, 14, ["العميل يتعرف على المستشار وتخصصه وأيام عمله", "ثم يحجز الاستشارة مباشرة"]),
    ("account", 2.2, 14, ["بعد الدخول، الشركة تجد حجزها القادم وباقاتها", "في لوحة واحدة مرتبة"]),
    ("wizard", 0, 18, ["الحجز يتم بهدوء: مستشار، موعد، وموقع", "وبعد التأكيد يظهر رقم الجلسة فوراً"]),
    ("client", 2.2, 16, ["العميل يرجع لحجزه وباقاته في أي وقت", "ويتابع موعد الجلسة من حسابه"]),
    ("office", 4.5, 16, ["المكتب يدير الحجوزات والباقات من لوحة واحدة", "مع صورة واضحة عن حركة العمل"]),
    ("schedule", 3.2, 14, ["المستشار يرتب أسبوع عمله", "فتظهر للعميل مواعيد منظمة وجاهزة"]),
]


def probe(path):
    return float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ], text=True).strip())


def still(image, seconds, dest):
    subprocess.check_call([
        "ffmpeg", "-y", "-loop", "1", "-i", str(image),
        "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
        "-t", str(seconds),
        "-vf", "fps=30,format=yuv420p",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        dest,
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def with_caption(webm, png, dest, start, minimum):
    dur = max(0.2, probe(webm) - start)
    pad = max(0.0, minimum - dur)
    subprocess.check_call([
        "ffmpeg", "-y", "-ss", str(start), "-i", str(webm), "-i", str(png),
        "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
        "-filter_complex",
        f"[0:v]scale=1440:900:flags=lanczos,fps=30,format=yuv420p,"
        f"tpad=stop_mode=clone:stop_duration={pad:.2f}[v];"
        "[v][1:v]overlay=0:H-h:format=auto[out]",
        "-map", "[out]", "-map", "2:a",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "aac", "-b:a", "96k", "-shortest",
        dest,
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    cards = OUT / "cards"
    cards.mkdir(exist_ok=True)
    title_card(
        cards / "open.png",
        "عرض تعريفي",
        "منصة الاستشارات",
        [
            "العميل يختار باقته، ويحجز جلسته مع المستشار،",
            "ويتابع الموعد والتقرير من حسابه.",
            "وفريق المكتب يدير التشغيل من لوحة واحدة.",
        ],
    )
    title_card(
        cards / "close.png",
        "الخلاصة",
        "تجربة واضحة للطرفين",
        [
            "اختيار سهل للعميل، وحجز منظم، وتقرير يصل إليه.",
            "ورؤية كاملة لفريق المكتب على الحجوزات والمدفوعات.",
        ],
    )
    parts = []
    still(cards / "open.png", 7, OUT / "00-open.mp4")
    parts.append(OUT / "00-open.mp4")
    for name, start, minimum, lines in CLIPS:
        png = cards / f"{name}.png"
        caption_bar(png, lines)
        dest = OUT / f"{name}.mp4"
        with_caption(SRC / f"{name}.webm", png, dest, start, minimum)
        parts.append(dest)
        print(name, round(probe(dest), 1))
    still(cards / "close.png", 7, OUT / "99-close.mp4")
    parts.append(OUT / "99-close.mp4")
    lst = OUT / "list.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts))
    final = ROOT / "output" / "gcmc-presentation.mp4"
    subprocess.check_call([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", "-movflags", "+faststart", str(final),
    ])
    print("FINAL", round(probe(final), 1), final)


if __name__ == "__main__":
    main()

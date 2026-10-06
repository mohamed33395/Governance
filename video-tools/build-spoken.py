#!/usr/bin/env python3
"""Business presentation with spoken Arabic and on-screen text."""

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/Users/amrmohamed/Documents/projects/Governance/video-tools")
SRC = ROOT / "output" / "business"
VOICE = ROOT / "output" / "voice"
OUT = ROOT / "output" / "spoken"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1440, 900
GREEN = "#1A412E"
CREAM = "#F6F4EE"
GOLD = "#C19B4A"
WHITE = "#F7F4EE"
FONT = "/System/Library/Fonts/GeezaPro.ttc"
title_font = ImageFont.truetype(FONT, 64, index=0)
sub_font = ImageFont.truetype(FONT, 34, index=0)
cap_font = ImageFont.truetype(FONT, 32, index=0)
small_font = ImageFont.truetype(FONT, 24, index=0)


def draw_ar(draw, xy, value, font, fill, anchor="ra"):
    draw.text(xy, value, font=font, fill=fill, anchor=anchor, direction="rtl", language="ar")


def title_card(path, kicker, headline, lines):
    im = Image.new("RGB", (W, H), CREAM)
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, W, 18), fill=GREEN)
    draw.rectangle((0, H - 18, W, H), fill=GREEN)
    draw.rectangle((96, 250, 176, 258), fill=GOLD)
    draw_ar(draw, (W - 120, 290), kicker, small_font, GOLD)
    draw_ar(draw, (W - 120, 360), headline, title_font, GREEN)
    y = 470
    for line in lines:
        draw_ar(draw, (W - 120, y), line, sub_font, "#3d5348")
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
        draw_ar(draw, (W - 72, y), line, cap_font, WHITE)
        y += 52
    im.save(path)


def probe(path):
    return float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ], text=True).strip())


def run(cmd):
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# name, visual, seek, caption lines
SCREENS = [
    ("02-home", "home", 0, ["من أول الشاشة، يفهم العميل قيمة الخدمة", "خبير معتمد، وحجز مباشر، وتقرير بعد الجلسة"]),
    ("03-packages", "packages", 0, ["الباقات واضحة ومناسبة لحجم المنشأة", "السعر والمدة والمميزات ظاهرة قبل الاختيار"]),
    ("04-consultants", "consultants", 0, ["يتعرف العميل على المستشار وتخصصه", "ثم يبدأ الحجز بثقة"]),
    ("05-account", "account", 2.2, ["بعد الدخول، الشركة تجد حجزها القادم", "وباقاتها النشطة في لوحة واحدة"]),
    ("06-wizard", "wizard", 0, ["الحجز بخطوات سهلة: المستشار، الموعد، والموقع", "وبعد التأكيد يظهر رقم الجلسة"]),
    ("07-client", "client", 2.0, ["من حساب العميل يمكن متابعة الموعد والباقة", "وتفاصيل الجلسة في أي وقت"]),
    ("08-office", "office", 4.5, ["فريق المكتب يرى الحجوزات ويدير الباقات", "من لوحة واحدة واضحة"]),
    ("09-schedule", "schedule", 3.2, ["المستشار يرتب أيام عمله وساعاته", "فتظهر مواعيد منظمة وجاهزة للحجز"]),
]


def still_with_voice(image, audio, dest):
    audio_dur = probe(audio)
    target = audio_dur + 0.45
    run([
        "ffmpeg", "-y", "-loop", "1", "-i", str(image), "-i", str(audio),
        "-t", f"{target:.3f}",
        "-vf", "fps=30,format=yuv420p,scale=1440:900",
        "-af", "volume=2dB,apad",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-shortest", dest,
    ])


def screen_with_voice(webm, png, audio, dest, seek):
    vis = max(0.4, probe(webm) - seek)
    audio_dur = probe(audio)
    target = max(vis, audio_dur) + 0.45
    pad = max(0.0, target - vis)
    run([
        "ffmpeg", "-y", "-ss", f"{seek:.3f}", "-i", str(webm), "-i", str(png), "-i", str(audio),
        "-filter_complex",
        f"[0:v]scale=1440:900:flags=lanczos,fps=30,format=yuv420p,"
        f"tpad=stop_mode=clone:stop_duration={pad:.3f},trim=duration={target:.3f},setpts=PTS-STARTPTS[v];"
        "[v][1:v]overlay=0:H-h:format=auto[out];"
        f"[2:a]volume=2dB,apad,atrim=0:{target:.3f},asetpts=PTS-STARTPTS[a]",
        "-map", "[out]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        dest,
    ])


def main():
    cards = OUT / "cards"
    cards.mkdir(exist_ok=True)
    title_card(
        cards / "open.png",
        "عرض تعريفي",
        "منصة الاستشارات",
        [
            "الشركة تختار الباقة، وتحجز الجلسة،",
            "وتتابع الموعد والتقرير من حسابها.",
        ],
    )
    title_card(
        cards / "close.png",
        "الخلاصة",
        "تجربة سهلة ومنظمة",
        [
            "اختيار واضح للعميل، وحجز مرتب، وتقرير يصل إليه.",
            "ورؤية كاملة لفريق المكتب على سير العمل.",
        ],
    )
    parts = []
    still_with_voice(cards / "open.png", VOICE / "01-open.aiff", OUT / "01-open.mp4")
    parts.append(OUT / "01-open.mp4")
    for name, visual, seek, lines in SCREENS:
        png = cards / f"{name}.png"
        caption_bar(png, lines)
        dest = OUT / f"{name}.mp4"
        screen_with_voice(SRC / f"{visual}.webm", png, VOICE / f"{name}.aiff", dest, seek)
        parts.append(dest)
        print(name, round(probe(dest), 1), flush=True)
    still_with_voice(cards / "close.png", VOICE / "10-close.aiff", OUT / "10-close.mp4")
    parts.append(OUT / "10-close.mp4")

    lst = OUT / "list.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts))
    final = ROOT / "output" / "gcmc-presentation.mp4"
    # Re-encode the join so players get one continuous timeline.
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
        "-fflags", "+genpts",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart",
        str(final),
    ])
    print("FINAL", round(probe(final), 1), final.stat().st_size)


if __name__ == "__main__":
    main()

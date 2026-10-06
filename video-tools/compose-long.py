#!/usr/bin/env python3
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/Users/amrmohamed/Documents/projects/Governance/video-tools")
SRC = ROOT / "output" / "long"
VOICE = ROOT / "output" / "voice-long"
OUT = ROOT / "output" / "long-ready"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1440, 900
GREEN = "#1A412E"
CREAM = "#F6F4EE"
GOLD = "#C19B4A"
WHITE = "#F7F4EE"
FONT = "/System/Library/Fonts/GeezaPro.ttc"
title_font = ImageFont.truetype(FONT, 62, index=0)
sub_font = ImageFont.truetype(FONT, 32, index=0)
cap_font = ImageFont.truetype(FONT, 30, index=0)
small_font = ImageFont.truetype(FONT, 24, index=0)


def draw_ar(draw, xy, value, font, fill, anchor="ra"):
    draw.text(xy, value, font=font, fill=fill, anchor=anchor, direction="rtl", language="ar")


def title_card(path, kicker, headline, lines):
    im = Image.new("RGB", (W, H), CREAM)
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, W, 16), fill=GREEN)
    draw.rectangle((0, H - 16, W, H), fill=GREEN)
    draw.rectangle((W - 280, 250, W - 140, 258), fill=GOLD)
    draw_ar(draw, (W - 140, 290), kicker, small_font, GOLD)
    draw_ar(draw, (W - 140, 370), headline, title_font, GREEN)
    y = 480
    for line in lines:
        draw_ar(draw, (W - 140, y), line, sub_font, "#3d5348")
        y += 56
    im.save(path)


def caption_bar(path, lines):
    bar_h = 34 + 50 * len(lines)
    im = Image.new("RGBA", (W, bar_h + 24), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, W, bar_h + 24), fill=(26, 65, 46, 255))
    draw.rectangle((0, 0, W, 6), fill=GOLD)
    y = 26
    for line in lines:
        draw_ar(draw, (W - 64, y), line, cap_font, WHITE)
        y += 50
    im.save(path)


def probe(path):
    return float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ], text=True).strip())


def run(cmd):
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def still(image, audio, dest):
    target = probe(audio) + 0.4
    run([
        "ffmpeg", "-y", "-loop", "1", "-i", str(image), "-i", str(audio),
        "-t", f"{target:.3f}",
        "-vf", "fps=30,format=yuv420p,scale=1440:900",
        "-af", "volume=2dB,apad",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-shortest", dest,
    ])


def screen(webm, png, audio, dest, seek=0):
    vis = max(0.4, probe(webm) - seek)
    aud = probe(audio)
    target = max(vis, aud) + 0.35
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
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", dest,
    ])


CLIPS = [
    ("02-home", "02-home.aiff", 1.6, ["الصفحة الأولى تعرض قيمة الخدمة", "خبير معتمد، وحجز مباشر، وتقرير بعد الجلسة"]),
    ("03-packages", "03-packages.aiff", 0.4, ["ثلاث باقات، الحديدية والفضية والذهبية", "السعر والمدة والاستشارات والمميزات ظاهرة"]),
    ("04-consultants", "04-consultants.aiff", 0.4, ["دليل المستشارين قبل الحجز", "الاسم، والتخصص، وأيام العمل"]),
    ("wizard", "wizard.aiff", 0.6, ["خطوات الحجز، المستشار ثم الموعد ثم الموقع", "وبعد التأكيد يظهر رقم الجلسة"]),
    ("10-client-home", "10-client-home.aiff", 0.6, ["لوحة العميل، الحجز القادم والباقات النشطة", "وصورة سريعة عن الجلسات والتقارير"]),
    ("11-client-booking", "11-client-booking.aiff", 0.5, ["تفاصيل الحجز في صفحة واحدة", "الباقة، المستشار، الموعد، الموقع، والدفع"]),
    ("12-client-more", "12-client-more.aiff", 0.4, ["التقارير، والباقات، والمواقع، وطرق الدفع", "كلها من حساب العميل"]),
    ("13-admin-home", "13-admin-home.aiff", 0.8, ["لوحة الإدارة، صورة اليوم عن العمل", "الحجوزات، التقارير، العملاء، والإيراد"]),
    ("14-admin-bookings", "14-admin-bookings.aiff", 0.6, ["الحجوزات حسب الحالة والباقة والمستشار", "وكل حجز يُفتح لتفاصيله"]),
    ("15-admin-session", "15-admin-session.aiff", 0.6, ["بعد الجلسة يُتم المكتب الحجز", "ثم يرفع التقرير ويصل إلى العميل"]),
    ("16-admin-pay", "16-admin-pay.aiff", 0.6, ["متابعة الدفع من صفحة المدفوعات", "المبلغ، والحالة، والبطاقة، ورقم الحجز"]),
    ("17-admin-reports", "17-admin-reports.aiff", 0.6, ["التقارير المرفوعة في قائمة واحدة", "مرتبطة بالحجز وبوصولها للعميل"]),
    ("18-admin-client", "18-admin-client.aiff", 0.8, ["ملف العميل، نظرة عامة وحجوزات وتقارير وباقات", "تاريخ الشركة في صفحة واحدة"]),
    ("19-admin-consultant", "19-admin-consultant.aiff", 0.8, ["ملف المستشار تبويباً تبويباً", "من التوفر والإجازات حتى التقارير والمواعيد"]),
    ("20-admin-packages", "20-admin-packages.aiff", 0.6, ["إدارة الباقات من المكتب", "السعر، والاستشارات، وحالة الظهور"]),
    ("21-consultant", "21-consultant.aiff", 0.8, ["حساب المستشار لجلساته ومواعيده", "الأسبوع، والإجازات، ومعاينة المواعيد"]),
]


def main():
    cards = OUT / "cards"
    cards.mkdir(exist_ok=True)
    wizard_audio = OUT / "wizard.aiff"
    parts_audio = [VOICE / f"{n}.aiff" for n in [
        "05-wiz-consultant", "06-wiz-time", "07-wiz-place", "08-wiz-pay", "09-wiz-done",
    ]]
    lst_a = OUT / "wizard-audio.txt"
    lst_a.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts_audio))
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst_a), "-c", "copy", str(wizard_audio)])

    title_card(cards / "open.png", "عرض تفصيلي", "منصة الاستشارات", [
        "من اختيار الباقة، إلى حجز الجلسة،",
        "ثم التقرير، ومتابعة الدفع.",
    ])
    title_card(cards / "close.png", "الخلاصة", "رحلة واحدة مكتملة", [
        "العميل يحجز ويتابع.",
        "المكتب يدير الجلسة والدفع والتقرير.",
        "والمستشار ينظم مواعيده.",
    ])
    caption_bar(cards / "wizard.png", ["خطوات الحجز، المستشار ثم الموعد ثم الموقع", "وبعد التأكيد يظهر رقم الجلسة"])

    parts = []
    still(cards / "open.png", VOICE / "01-open.aiff", OUT / "01-open.mp4")
    parts.append(OUT / "01-open.mp4")
    for name, audio_name, seek, lines in CLIPS:
        png = cards / f"{name}.png"
        if name != "wizard":
            caption_bar(png, lines)
        audio = wizard_audio if name == "wizard" else VOICE / audio_name
        dest = OUT / f"{name}.mp4"
        screen(SRC / f"{name}.webm", png if name != "wizard" else cards / "wizard.png", audio, dest, seek)
        parts.append(dest)
        print(name, round(probe(dest), 1), flush=True)
    still(cards / "close.png", VOICE / "22-close.aiff", OUT / "22-close.mp4")
    parts.append(OUT / "22-close.mp4")
    lst = OUT / "list.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts))
    final = ROOT / "output" / "gcmc-presentation.mp4"
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
        "-fflags", "+genpts",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart", str(final),
    ])
    print("FINAL", round(probe(final), 1))


if __name__ == "__main__":
    main()

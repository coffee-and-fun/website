---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: "Reverse Engineering LEGO Smart Play: Discovery & First NFC Reads (Part 1)"
description: |
  A discovery post documenting our attempt to be the first to fully reverse engineer the LEGO Smart Play NFC protocol. We tear down the NFC tags in the Star Wars 75423 X-Wing set using a Flipper Zero, analyze the encrypted payloads, and share raw dump files.
keywords: |
  LEGO Smart Play, NFC reverse engineering, Flipper Zero, LEGO Star Wars 75423, Smart Brick, NFC-V, ISO 15693, EM4237, Grain-128A, LEGO hack, NFC dump, Smart Tags, LEGO minifigure NFC
url: blog/reverse-engineering-lego-smart-play-nfc-part-1/
isBlog: true
blog_cat: Development
youtubeId:
cardTitle: "Reverse Engineering LEGO Smart Play: Discovery & First NFC Reads (Part 1)"
blog_snip: |
  We got early access to LEGO's new Smart Play system and started reverse engineering the NFC protocol. Here's what we found inside the tags using a Flipper Zero, including UIDs, encrypted payloads, and a Grain-128A hypothesis.
name: Robert James Gabriel
img: /assets/images/blog/reverse-engineering-lego-smart-play-nfc-part-1.png
date: 2026-02-28T00:00:00.000Z
time: 15 min
tags:
  - hack
  - guide
  - blog
---

This is a discovery post. We're in the middle of figuring this out, and we're sharing everything as we go, the wins, the dead ends, and the raw data. If you want to follow along or do your own analysis, you can download the [full NFC dump files](#raw-data-downloads) at the bottom.

[LEGO](https://www.lego.com) just launched something genuinely new. Not another app-controlled set with a Bluetooth hub you've seen before. This is **[Smart Play](https://www.lego.com/themes/smart-play)**, a completely new interactive system built around NFC tags embedded directly into bricks, minifigures, and accessories. The first wave includes the Star Wars **[75423 Luke's Red Five X-Wing](https://www.lego.com/product/luke-s-red-five-x-wing-75423)**, an all-in-one Smart Play set with 581 pieces.

And thanks to [Walmart](https://www.walmart.com) jumping the gun on the release date, I got my hands on one early.

This is Part 1 of a series documenting our attempt to be the first to fully reverse engineer the LEGO Smart Play NFC protocol. Here's what we've found so far.

## What is LEGO Smart Play?

Smart Play is LEGO's new interactive building system. At its core is the **Smart Brick**, a transparent and black 2x4 LEGO brick with a custom ASIC chip inside (about 4.1mm in diameter). It has an embedded NFC reader, [Bluetooth Low Energy](https://en.wikipedia.org/wiki/Bluetooth_Low_Energy), an RGB LED, a speaker, and it charges wirelessly via a yellow USB-C charging pad included in the set.

The system works like this: you build the set normally, but certain pieces, **Smart Tags** (small red tiles with Star Wars iconography) and **Smart Minifigures** (standard minifigs with an NFC tag embedded in the torso), contain NFC chips. When you place these near the Smart Brick during play, the brick detects them via [NFC-V (ISO 15693)](https://en.wikipedia.org/wiki/ISO/IEC_15693) and reacts with lights, sounds, and game events through the companion LEGO Smart Play Assist app.

The [75423 X-Wing set](https://www.lego.com/product/luke-s-red-five-x-wing-75423) includes:

- 1x Smart Brick (clear/black 2x4, [FCC ID: NPI28738](https://fcc.report/FCC-ID/NPI28738))
- 1x Wireless charging pad (yellow, USB-C)
- Multiple Smart Tags (red tiles with X-Wing, shield, and weapon icons)
- 2x Smart Minifigures (Luke Skywalker and Princess Leia)
- The X-Wing model itself, with a slot for the Smart Brick

What makes this different from [LEGO Powered Up](https://www.lego.com/themes/powered-up) or [MINDSTORMS](https://en.wikipedia.org/wiki/Lego_Mindstorms) is that the NFC interaction is passive from the tag side. The Smart Brick does all the work. It's constantly polling for NFC tags whenever it's powered on. The tags themselves have no battery. This means the interactive elements are just regular-looking LEGO pieces with chips inside.

## Walmart Broke the Release Date

A quick note on timing: this set wasn't supposed to be available yet. Walmart put it on shelves early, ahead of LEGO's official launch. So if you're reading this wondering how someone already has it, that's why. The official release and marketing push hadn't happened yet when I picked this up, which also means documentation is essentially non-existent. Perfect conditions for reverse engineering.

## Getting Hands-On: Scanning with the Flipper Zero

My tool of choice for NFC analysis is the **[Flipper Zero](https://flipperzero.one/)** running [Unleashed firmware](https://github.com/DarkFlippers/unleashed-firmware) (v0.85). The Flipper's NFC module uses an [ST25R3916](https://www.st.com/en/nfc/st25r3916.html) chip, which supports [ISO 15693](https://en.wikipedia.org/wiki/ISO/IEC_15693) (NFC-V), the same protocol these LEGO tags use.

The very first thing I did after building the set was grab the Flipper and start scanning every tag and minifigure I could find. The process is straightforward: hold the Flipper near a tag, let it detect and read, then save. I went through each piece one by one. The X-Wing body, the wing tag, Luke, Leia, R2-D2, the shield, the shooter, and a few more.

The Flipper's naming system generated some great random names for the first few reads. "Unnameable_corridor" and "Unthinkable_door" were two of the auto-generated names before I started renaming them to something more useful like "Car", "Luke", "Rd", "Xwing", and so on. If you've used a Flipper, you know the on-screen keyboard for renaming cards. We spent a good chunk of time just going through each piece, scanning, naming, and organizing.

Every scan came back the same way: **ISO15693-3 (Unknown)**. The Flipper recognizes the protocol but doesn't know the specific chip variant. That "(Unknown)" label was actually our first clue that these weren't standard NFC tags. They're using something the Flipper's database doesn't have a profile for.

Each read showed the same basic structure: a UID starting with `E0 16`, 264 bytes of memory across 66 blocks of 4 bytes each. Consistent across every single tag in the set.

## What the Flipper Found: The Full Tag Inventory

Here's every tag we scanned, with UIDs and data characteristics:

| Tag Name | What It Is | UID | Payload Length | Byte 2 |
|---|---|---|---|---|
| [Car](/assets/downloads/lego-smart-play-nfc/Car.nfc) | X-Wing body | E0:16:5C:01:22:14:09:B4 | 105 bytes | 0x69 |
| [Xwing](/assets/downloads/lego-smart-play-nfc/Xwing.nfc) | Wing tag | E0:16:5C:01:1B:F4:E6:04 | 107 bytes | 0x6B |
| [Luke](/assets/downloads/lego-smart-play-nfc/Luke.nfc) | Luke minifigure | E0:16:5C:01:1B:C5:76:6A | 157 bytes | 0x9D |
| [Layla](/assets/downloads/lego-smart-play-nfc/Layla.nfc) | Leia minifigure | E0:16:5C:01:27:38:FF:A4 | 158 bytes | 0x9E |
| [Rd](/assets/downloads/lego-smart-play-nfc/Rd.nfc) | R2-D2 small tag | E0:16:5C:01:26:19:A8:ED | 74 bytes | 0x4A |
| [Shooter](/assets/downloads/lego-smart-play-nfc/Shooter.nfc) | Weapon tag | E0:16:5C:01:22:14:09:xx | ~100 bytes | varies |
| [Vacrum](/assets/downloads/lego-smart-play-nfc/Vacrum.nfc) | Accessory tag | E0:16:5C:01:xx:xx:xx:xx | ~100 bytes | varies |
| [Unnameable_corridor](/assets/downloads/lego-smart-play-nfc/Unnameable_corridor.nfc) | Additional tag | E0:16:5C:01:xx:xx:xx:xx | varies | varies |
| (New scan) | Unknown tag | E0:16:5C:01:27:6D:02:BA | TBD | TBD |

We also discovered at least one more tag during a later scanning session (UID `E0:16:5C:01:27:6D:02:BA`) that we hadn't catalogued initially. There may be tags we missed inside the build, or this could be a duplicate read of one of the minifigures from a different angle. We're still sorting that out.

The raw `.nfc` dump files for every tag are available for [download below](#raw-data-downloads) so you can do your own analysis.

Every single tag shares these characteristics:

- **Protocol:** [ISO 15693-3](https://en.wikipedia.org/wiki/ISO/IEC_15693) (NFC-V, 13.56 MHz)
- **Manufacturer:** [EM Microelectronic](https://www.emmicroelectronic.com/) (manufacturer code 0x16)
- **IC Reference:** 0x17
- **Memory:** 66 blocks x 4 bytes = 264 bytes total
- **Block security:** First 64 blocks locked, last 2 unlocked
- **DSFID / AFI:** Both 0x00

## Our Thoughts: The NFC Chips

The UID prefix `E0:16` tells us these are [ISO 15693](https://en.wikipedia.org/wiki/ISO/IEC_15693) compliant tags (E0 = ISO standard prefix) made by [EM Microelectronic](https://www.emmicroelectronic.com/) (0x16 = EM Micro's [IANA-assigned manufacturer code](https://www.iana.org/assignments/enterprise-numbers/)). The IC Reference value of 0x17 is the key finding. Based on EM Micro's product line, we believe this is most likely the **[EM4237](https://www.emmicroelectronic.com/product/nfc-high-frequency-ic/em4237)** or a close variant.

Why does that matter? The EM4237 supports **[Grain-128A](https://en.wikipedia.org/wiki/Grain_(cipher)) stream cipher authentication**. This is a lightweight cipher designed specifically for constrained devices like NFC tags. EM Micro's custom command set includes `EM_AUTH` (command 0xB3) which initiates the Grain-128A challenge-response authentication sequence.

Our thinking: LEGO isn't just reading UIDs. They're almost certainly doing cryptographic authentication to prevent counterfeiting and ensure only genuine LEGO Smart Tags work with the system. If that's the case, simply cloning a tag's UID and memory content won't be enough to fool the Smart Brick. The tag has to prove it knows a shared secret during a challenge-response handshake.

This is our main hypothesis right now, and it's what we're trying to confirm in Part 2.

## Data Analysis: What's Actually on the Tags?

We spent a lot of time staring at hex dumps. Here's what we've pieced together so far.

Each tag starts with a consistent 5-byte header, followed by what appears to be encrypted payload data:

```
Byte 0:  0x00        (always zero across all tags)
Byte 1:  [length]    (varies per tag, matches payload size exactly)
Byte 2:  0x01        (constant)
Byte 3:  0x0C        (constant)
Byte 4:  0x01        (constant)
Byte 5+: [payload]   (encrypted data)
```

The header `00 [len] 01 0C 01` is consistent across all 8+ tags we scanned. After byte 4, the data is encrypted, and it's well encrypted. We ran [Shannon entropy](https://en.wikipedia.org/wiki/Entropy_(information_theory)) analysis across all the dumps and got a score of approximately **7.68 out of 8.0**, meaning the payload bytes are nearly indistinguishable from random data. There are no obvious patterns, repeating sequences, or ASCII strings visible. Whatever encryption or key derivation LEGO is using, it's doing its job.

Here's an example. The first 32 bytes from the [Car tag](/assets/downloads/lego-smart-play-nfc/Car.nfc) (X-Wing body):

```
00 69 01 0C 01 8F F9 DC E3 CA 78 71 20 9C 16 50
56 66 6D E9 6C 55 B3 C0 14 31 63 0E 1D 53 E6 F6
```

And the same position from [Luke's minifigure](/assets/downloads/lego-smart-play-nfc/Luke.nfc):

```
00 9D 01 0C 01 86 84 CC 84 C0 2C 26 17 C7 F2 2F
6A FB FC 1A EA C1 43 C3 7B F1 0E E8 E4 2D 41 53
```

Same header structure, completely different payload. No correlation between the two.

## Payload Size Varies by Tag Type

This was an interesting discovery. Different types of tags carry different amounts of data:

- **Small accessory tags** ([R2-D2](/assets/downloads/lego-smart-play-nfc/Rd.nfc), shield, weapons): ~74 bytes of payload
- **Vehicle/body tags** ([X-Wing car](/assets/downloads/lego-smart-play-nfc/Car.nfc), [wing](/assets/downloads/lego-smart-play-nfc/Xwing.nfc)): ~105-107 bytes
- **Minifigure tags** ([Luke](/assets/downloads/lego-smart-play-nfc/Luke.nfc), [Leia](/assets/downloads/lego-smart-play-nfc/Layla.nfc)): ~157-158 bytes

Our thinking here is that the encrypted payload contains actual game data, like character attributes, item types, perhaps ability stats, rather than just a simple identifier. The minifigures carry roughly twice the data of a small accessory, which makes sense if they store character identity, progression, or state information. The vehicle tags fall in between, possibly storing vehicle configuration or upgrade data.

## Block Security: A Clue About Write-Back

All tags have the first 64 blocks (256 bytes) locked and the last 2 blocks (8 bytes) unlocked. The locked blocks contain the header and encrypted payload. The unlocked blocks are all zeros on our fresh-out-of-the-box tags.

This detail stood out to us. Having writable blocks at the end suggests the Smart Brick might write data back to the tags during play. Think about it. Character progression? Play session data? Achievement flags? High scores? We don't know yet, but the fact that LEGO deliberately left those blocks unlocked on every single tag is telling. It's not an accident. Those 8 bytes are reserved for something.

Once we get the emulation protocol capture working (Part 2), we'll be watching closely for any WRITE commands targeting those last two blocks.

## The Smart Brick Hardware

The Smart Brick itself is a marvel of miniaturization. Inside a standard 2x4 LEGO brick form factor, they've packed:

- Custom ASIC chip (approximately 4.1mm diameter)
- NFC reader/writer ([ISO 15693](https://en.wikipedia.org/wiki/ISO/IEC_15693))
- [Bluetooth Low Energy](https://en.wikipedia.org/wiki/Bluetooth_Low_Energy) radio
- RGB LED (we've seen it light up blue when it detects tags on the charger)
- Piezo speaker
- Wireless charging coil ([Qi](https://en.wikipedia.org/wiki/Qi_(standard))-compatible)
- Battery

The [FCC filing (NPI28738)](https://fcc.report/FCC-ID/NPI28738) reveals it was developed in partnership with [Cambridge Consultants](https://www.cambridgeconsultants.com/) and manufactured by [Jabil](https://www.jabil.com/). The firmware version as of our unit is v0.72.33, visible in the Smart Play Assist companion app.

One behavioral observation that's relevant to the reverse engineering: the Smart Brick only accepts Bluetooth connections when it's sitting on the wireless charging pad. During normal play (off the charger), it operates independently using just NFC. This means the Bluetooth side is primarily for firmware updates, app configuration, and volume control. The actual gameplay interaction is all NFC.

Another key observation: the Smart Brick seems to be constantly polling for NFC tags when powered on. It doesn't wait for a button press or app command. It's always listening. This is important because it means there's a continuous polling loop we should be able to capture.

## BLE Protocol: A Quick Look

When the Smart Brick is on the charger and connected via Bluetooth, it uses the **[LEGO Wireless Protocol v3 (LWP3)](https://lego.github.io/lego-ble-wireless-protocol-docs/)**. The primary GATT service UUID is `00001623-1212-EFDE-1623-785FEABCD123`. This is the same protocol family as [Powered Up](https://www.lego.com/themes/powered-up), extended for Smart Play.

We also found references to **BrickNet**, a Bluetooth mesh networking protocol for brick-to-brick communication. This hints at future multi-brick sets. For now though, our focus is entirely on the NFC side.

We looked into whether we could sniff BLE traffic from a FAP app on the [Flipper Zero](https://flipperzero.one/), but the Flipper's BLE stack only supports peripheral/beacon mode for FAP apps, no central/scanner mode. BLE analysis would need a separate tool like an [nRF52840 dongle](https://www.nordicsemi.com/Products/Development-hardware/nRF52840-Dongle). That's a project for another day.

## What's Next

We've got the raw data. We know the chip type, the memory layout, the encryption characteristics, and we have a working hypothesis about [Grain-128A](https://en.wikipedia.org/wiki/Grain_(cipher)) authentication. But we're still looking at this from the tag side, the static data.

To understand the protocol, the dynamic conversation between the Smart Brick and a tag during play, we need to observe the NFC communication in real-time. That's what Part 2 is about: building a custom [Flipper Zero](https://flipperzero.one/) application to capture the protocol exchange.

## Raw Data Downloads

We're sharing our complete NFC dump files so the community can analyze alongside us. Each `.nfc` file is in [Flipper Zero](https://flipperzero.one/) format and contains the full 264-byte memory dump:

- [Car.nfc](/assets/downloads/lego-smart-play-nfc/Car.nfc), X-Wing body tag (UID: E0:16:5C:01:22:14:09:B4)
- [Xwing.nfc](/assets/downloads/lego-smart-play-nfc/Xwing.nfc), Wing tag (UID: E0:16:5C:01:1B:F4:E6:04)
- [Luke.nfc](/assets/downloads/lego-smart-play-nfc/Luke.nfc), Luke Skywalker minifigure (UID: E0:16:5C:01:1B:C5:76:6A)
- [Layla.nfc](/assets/downloads/lego-smart-play-nfc/Layla.nfc), Princess Leia minifigure (UID: E0:16:5C:01:27:38:FF:A4)
- [Rd.nfc](/assets/downloads/lego-smart-play-nfc/Rd.nfc), R2-D2 accessory tag (UID: E0:16:5C:01:26:19:A8:ED)
- [Shooter.nfc](/assets/downloads/lego-smart-play-nfc/Shooter.nfc), Weapon tag
- [Vacrum.nfc](/assets/downloads/lego-smart-play-nfc/Vacrum.nfc), Accessory tag
- [Unnameable_corridor.nfc](/assets/downloads/lego-smart-play-nfc/Unnameable_corridor.nfc), Additional tag

---

This is an active discovery project by [Coffee & Fun](https://www.coffeeandfun.com). We're figuring this out as we go and sharing everything. Part 2 covers building the NFC-V Capture app for [Flipper Zero](https://flipperzero.one/), our failed firmware flashing attempts, and the first protocol capture tests.

**Set analyzed:** [LEGO Star Wars 75423](https://www.lego.com/product/luke-s-red-five-x-wing-75423), Luke's Red Five X-Wing (Smart Play All-in-One, 581 pieces)

**Tools:** [Flipper Zero](https://flipperzero.one/) (Unleashed 0.85), custom NFC-V Capture FAP v3.0

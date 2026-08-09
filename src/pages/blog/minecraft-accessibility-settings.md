---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: "Minecraft Accessibility Settings, Reviewed and Scored"
description: Every Minecraft accessibility setting in Java and Bedrock, listed with exact values and scored out of 25. The two editions are not the same game.
keywords:
  Minecraft accessibility settings, Minecraft accessibility, Minecraft Java accessibility,
  Minecraft Bedrock accessibility, Minecraft narrator, Minecraft closed captions, Minecraft high
  contrast, Minecraft text to speech, Minecraft colourblind, accessible games, The Accessibility
  Options series
url: blog/minecraft-accessibility-settings/
isBlog: true
blog_cat: Inclusion
youtubeId:
cardTitle: "Minecraft Accessibility Settings, Reviewed and Scored"
name: Robert James Gabriel
img: /assets/images/blog/minecraft-accessibility-settings.png
date: 2026-08-09T12:00:00.000Z
time: 14 min
tags:
  - accessibility
  - gaming
  - series
---

Minecraft is the best selling video game ever made. It is in classrooms. It is the game a lot of disabled players start with, because it has no reflexes to fail and no timer to beat. So it is the right place to start [The Accessibility Options](/blog/how-we-score-game-accessibility/), and it is the game every later review in this series gets measured against.

The short version: Minecraft is genuinely good, and it is two different games about it.

Java Edition and Bedrock Edition have different accessibility menus, different strengths, and one enormous difference nobody puts on the store page. If you or your child needs a controller, one of these editions cannot help you at all.

## The scorecard

| Category | Java | Bedrock |
|---|---|---|
| Seeing | 4 | 3 |
| Hearing | 5 | 4 |
| Playing | 2 | 4 |
| Understanding | 3 | 3 |
| Finding it | 4 | 4 |
| **Total** | **18 / 25** | **18 / 25** |

Same total, arrived at completely differently. That is the interesting part.

<!-- TODO: Robert, drop the menu screenshots in here. Ideally: the Java Accessibility Settings page, the Java sound sliders (all eleven), the Bedrock Accessibility tab, and the Bedrock controller remapping screen. Captions can name the edition and version you tested. -->

## Seeing

### Java: 4 out of 5

| Setting | Options available | Notes |
|---|---|---|
| Closed Captions | On, Off | Transcribes sound effects, not just speech |
| Text Background | Chat only, Everywhere | |
| Text Background Opacity | Slider | |
| Chat Text Opacity | Slider | |
| Line Spacing | Slider | |
| High Contrast | On, Off | A built in resource pack, added in 1.19.4 |
| High Contrast Block Outlines | On, Off | Added later, in 1.21.2 |
| Distortion Effects | Percentage slider | Nausea and portal warping |
| FOV Effects | Percentage slider | The field of view lurch when you sprint |
| View Bobbing | On, Off | |
| Damage Tilt | Percentage slider | Screen tilt when hit, can go to zero |
| Darkness Pulsing | Percentage slider | The Warden's darkness effect |
| Hide Sky Flashes | On, Off | Lightning |
| Glint Strength | Percentage slider | Enchantment shimmer |
| Glint Speed | Percentage slider | |
| Menu Background Blur | Slider | |
| Panorama Scroll Speed | Percentage slider | The rotating title screen |
| Monochrome Logo | On, Off | |
| Notification Time | Multiplier | How long toasts stay up |
| Hide Splash Texts | On, Off | The yellow joke text |
| Rotate with Minecarts | On, Off | |

That is a serious list. What lifts it above a tick box exercise is that most of these are **sliders rather than toggles**. Damage tilt, distortion, glint speed and darkness pulsing can each be dialled to a personal tolerance instead of all or nothing. For anyone with vestibular sensitivity, that difference is the difference between playing and not playing.

The point off is text size. Minecraft has no text scaling in the way most games mean it. GUI Scale exists in Video Settings and it steps the whole interface in whole numbers, which is coarse and couples the text to everything else on screen.

### Bedrock: 3 out of 5

| Setting | Options available | Notes |
|---|---|---|
| Closed Captions | On, Off | |
| Location of closed captions | Configurable, defaults to top right | Java cannot move them |
| Closed caption duration | Seconds, defaults to 1.5 | Java cannot change this |
| Camera Shake | On, Off | Toggle only, no slider |
| Hide Sky Flashes | On, Off | |
| Screen distortion | Percentage, defaults to 100% | |
| Darkness effect strength | Percentage, defaults to 100% | |
| Glint strength | Percentage, defaults to 75% | |
| Glint speed | Percentage, defaults to 50% | |
| Block dithering | On, Off | |
| Player and mob dithering | On, Off | |
| Action Bar Background Opacity | Percentage, defaults to 60% | |
| Chat Background Opacity | Percentage, defaults to 70% | |
| Text Background Opacity | Percentage, defaults to 60% | |
| Chat message duration | Seconds, defaults to 10 | |
| Toast notification duration | Seconds, defaults to 3 | |
| GUI Scale Modifier | Percentage, defaults to 100% | A real percentage, not Java's whole steps |
| Extra large new UI | On, Off | |

Bedrock wins on two things Java simply does not have: **you can move the captions and change how long they stay**, and **GUI Scale is a percentage** rather than integer steps, with an extra large mode on top.

It loses the point on camera shake, which is a toggle where Java gives a slider, and on the absence of a high contrast mode entirely.

## Hearing

### Java: 5 out of 5

This is the best part of Minecraft and one of the best in any game.

| Setting | Options available |
|---|---|
| Volume sliders | Master, Music, Jukebox and Note Blocks, Weather, Blocks, Hostile Mobs, Friendly Mobs, Players, Ambient and Environment, Voice and Speech, UI |
| Closed Captions | On, Off |
| Narrator | Off, Chat, System, All |
| Narrator Hotkey | On, Off |

**Eleven separate volume channels.** Not master and music. Eleven. You can mute friendly mobs while leaving hostile mobs audible, which is a genuine gameplay accessibility decision, because hostile mob sound is information you need and a cow is not.

The captions deserve their own paragraph. Minecraft's closed captions transcribe **sound effects, positionally**. "Skeleton rattles" appears with a directional arrow showing where it came from. That is not a subtitle system, it is a sound to sight translation layer, and it is the reason a deaf player can survive a cave.

That is what a 5 looks like. Other studios should copy this.

### Bedrock: 4 out of 5

| Setting | Options available |
|---|---|
| Volume sliders | Global, Music, Sound, Environmental audio, Blocks, Hostile mobs, Friendly mobs, Other players, Musical blocks, Weather, Text to speech |
| Closed Captions | On, Off, with position and duration control |
| Hide your sounds | On, Off |
| Hide weather and ambient sounds | On, Off |
| Text To Speech with Device Settings | On, Off |
| Text To Speech For UI | On, Off |
| Text To Speech For Chat | On, Off |
| Text to speech volume | Percentage |

Bedrock matches the channel count and adds caption filtering, so you can hide your own sounds and the weather to stop the caption box drowning in rain. Its text to speech is also split three ways, UI and chat separately, with its own volume.

Why 4 and not 5: no dedicated narrator mode equivalent to Java's, and the text to speech leans on the device layer rather than being fully self contained.

## Playing

This is where the two editions stop being the same product.

### Java: 2 out of 5

| Setting | Options available | Notes |
|---|---|---|
| Key bindings | Every control rebindable | Genuinely complete for keyboard |
| Auto-Jump | On, Off | Removes a constant input |
| Mouse sensitivity | Slider | |
| Sneak, Sprint | Hold or Toggle | |

Java Edition **has no native controller support.** It is keyboard and mouse only. There is no remapping screen for a gamepad because there is no gamepad.

For a player who cannot use a keyboard and mouse, Java Edition is not partly accessible. It is unavailable. Third party software exists and the community has built solutions, but a workaround you have to discover, install and configure is not an accessibility feature, and this series does not score it as one.

Everything Java does offer here is good. Full rebinding is genuinely full. Auto-jump removes an input you would otherwise make thousands of times, which matters enormously for fatigue and for anyone using a switch or a mouth stick. Toggle sprint and toggle sneak are there.

It is still a 2, because the largest input question a disabled player can ask is answered with no.

### Bedrock: 4 out of 5

| Setting | Options available | Notes |
|---|---|---|
| Controller support | Native on all platforms | Xbox, PlayStation and Switch pads all mapped |
| Controller remapping | Full customisation | |
| Touch controls | Button size, position and opacity all adjustable | |
| Keyboard and mouse | Supported and rebindable | |
| Auto-Jump | On, Off | |

Bedrock supports controllers everywhere, lets you remap them, and lets you resize and reposition the touch buttons, which is the thing that makes it playable on a tablet for someone with limited reach or tremor.

The missing point is the same one most games miss: no documented one handed layout, and the hold versus toggle options do not extend to every hold action.

## Understanding

Both editions: 3 out of 5.

| Setting | Options available | Notes |
|---|---|---|
| Difficulty | Peaceful, Easy, Normal, Hard | Changeable mid game |
| Peaceful mode | No hostile mobs, health regenerates | The strongest cognitive accessibility feature in the game |
| Auto-Jump | On, Off | Also a cognitive load reduction |
| Chat Delay | None, or adjustable | Java. Slows how fast chat arrives |
| Chat message duration | Seconds | Bedrock |
| Tutorial | Bedrock has an optional tutorial world | Java has none |

**Peaceful is the underrated feature.** A difficulty setting that removes the threat entirely, switchable at any moment without restarting, means a player who is overwhelmed can turn the pressure off and keep the world they built. Very few games let you do that mid save.

Both lose points for the same reasons. Minecraft explains almost nothing. There is no in game glossary, no recap when you return after a month, no objective system at all, and the crafting system is famously undiscoverable without the recipe book or a wiki open on a second screen. That is a design choice, and for a lot of players it is the barrier they never get past.

## Finding it

Both editions: 4 out of 5.

This is the category the rest of this series will be judged against, so here is the detail.

**Java.** Title screen, then Options, then Accessibility Settings. Two clicks from launch, before you touch a world. There is also an Accessibility Settings button on the title screen itself. Everything applies immediately and persists. The audio sliders live under Music and Sounds rather than in the accessibility page, which is the only real fault.

**Bedrock.** Settings, then a dedicated Accessibility tab, reachable from the main menu before loading a world. The same tab is available while in game. Settings persist across sessions and sync with the account.

Both editions let you configure everything before you are committed to anything, which is more than most games manage. Neither loses you to an unskippable prologue, because there isn't one.

The point off, for both: the store pages do not tell you any of this. Neither the Java page nor the console store listings surface the accessibility feature list before purchase, which is the exact gap Microsoft's own [Xbox Accessibility Guidelines](https://learn.microsoft.com/en-us/xbox/accessibility/guidelines) address in XAG 121. Microsoft owns Mojang. The guidance is coming from inside the house.

## The one thing they nailed

Positional closed captions. Minecraft does not subtitle dialogue, because Minecraft has no dialogue. Instead it transcribes the world: a creeper hissing, a skeleton rattling, water flowing, each with a direction indicator.

It converts the game's most safety critical channel, sound, into vision, and it does it without changing how the game plays for anyone else. That is the textbook definition of a good accessibility feature, and it shipped years before most of the industry took captions seriously.

## The one thing they missed

Text size. In the best selling game on earth, on a device that might be a phone, there is no proper text scaling in Java Edition. GUI Scale moves the whole interface in whole number steps. Bedrock's percentage modifier is better and still not text specific.

For a game with this much on screen text, in inventories, chat, advancement popups and signs, a real text size control is overdue.

## Set these three first

For anyone handing Minecraft to a child, a student or themselves:

1. **Turn on Closed Captions.** Accessibility Settings in both editions. Even hearing players benefit, and it is the single highest value toggle in the game.
2. **Drop Damage Tilt and Distortion Effects to zero** on Java, or Screen distortion and Camera Shake on Bedrock. Motion sickness ends more Minecraft sessions than creepers do.
3. **Set difficulty to Peaceful** for a first world. You can raise it later without losing anything.

## Who it works for, and who it does not

**Works well for:** deaf and hard of hearing players, who are better served here than in most games. Players with vestibular sensitivity, thanks to the sliders. Players who need a game with no reflex requirement and no failure timer. Blind and low vision players get real narrator and text to speech support, though not enough to play unaided.

**Does not work for, yet:** anyone who needs a controller and wants Java Edition. Buy Bedrock. Anyone who needs large text will find both editions frustrating.

## The verdict

18 out of 25 for both editions, reached by opposite routes. Java has the better fine control and the high contrast mode and no controller support. Bedrock has the input options and the scalable interface and a shallower set of visual sliders.

That split is itself the finding. Two products with the same name, the same publisher and the same price bracket give disabled players meaningfully different games, and nothing at the point of purchase tells you which one you need. A player who buys wrong does not discover it until they are already in.

We have written before about [reviewing a product through an accessibility lens](/blog/waymo-review-accessibility-and-the-future-of-transport/) rather than a features lens. Minecraft is the clearest case yet of why the lens matters. By any normal review standard these are the same game. By this one they are not.

18 out of 25 is the baseline now. Every game in [The Accessibility Options](/blog/how-we-score-game-accessibility/) gets measured against it.

---

*Settings verified against Minecraft Java Edition and Bedrock Edition current releases at the time of writing, cross checked against the [Minecraft Wiki options reference](https://minecraft.wiki/w/Options) and Mojang's own help documentation. Accessibility options move between updates. If you find one we missed or one that has changed, tell us and we will correct the post and say that we did.*

<!-- TODO: Robert, confirm the exact version numbers you tested on for both editions and swap them into the line above. Also worth a sentence on the Bedrock tutorial world if it is still there in the version you played, since I could not confirm it is still shipped. -->

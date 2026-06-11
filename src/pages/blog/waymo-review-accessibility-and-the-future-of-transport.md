---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: We Took Waymo Around San Francisco. Here's What We Learned About Accessibility and the Future of Transport.
description:
  As an accessibility-focused company, we spent a day riding Waymo's autonomous vehicles across San
  Francisco — at night, during rush hour, and through quiet streets. Here's our honest review of the
  tech, the ride, and what it means for people with disabilities.
keywords:
  Waymo, Autonomous Vehicles, Self Driving Cars, Accessibility, Jaguar I-PACE, Lidar, San Francisco,
  Disability, Blind, Deaf, Wheelchair, Coffee and Fun, Waymo Review, Robotaxi
url: blog/waymo-review-accessibility-and-the-future-of-transport/
isBlog: true
blog_cat: Usecase
youtubeId:
cardTitle: We Took Waymo Around San Francisco
blog_snip:
  As an accessibility-focused company, we spent a day riding Waymo across San Francisco. Here's our
  honest review of the tech, the accessibility, and the one thing they need to fix.
name: Robert James Gabriel
img: /assets/images/blog/waymo-review-accessibility-and-the-future-of-transport.png
date: 2026-05-13T00:00:00.000Z
time: 12 min
tags:
  - social
  - guide
---

We build accessibility tools for a living. Our browser extensions like [Helperbird](https://www.helperbird.com) help over a million people read, write, and browse the web more easily. So when we were in San Francisco recently, we had to try Waymo. Not just once. We took it at night, during the morning rush, in the middle of the day, and through some of the steepest streets the city has to offer.

We wanted to know: what does a fully autonomous ride actually feel like? And more importantly, how does it hold up from an accessibility standpoint?

Here's what we found.

---

## What Waymo Actually Is

If you haven't tried it yet, [Waymo](https://waymo.com/) is a fully self-driving ride-hailing service owned by Alphabet, Google's parent company. No driver. No steering wheel input. You request a ride through an app, a car shows up, you get in, and it takes you where you need to go. The whole thing is run by what Waymo calls the [Waymo Driver](https://waymo.com/waymo-driver/), an AI system that handles everything from navigating intersections to yielding to pedestrians.

The vehicles we rode in San Francisco are white Jaguar I-PACEs, fully electric SUVs fitted with a sensor suite on the roof and around the body. You'll spot them everywhere in the city now. They're quiet, clean, and honestly a little surreal to see rolling through traffic with nobody behind the wheel.

As of early 2026, Waymo has completed over [170 million fully autonomous miles](https://waymo.com/blog/shorts/waymo-safety-impact-update-170m/) without a human driver. That's more than 150 human driving lifetimes of experience. They're currently operating in San Francisco, Phoenix, Los Angeles, and Austin, and [expanding to London in 2026](https://waymo.com/community/articles/uk-safety-and-accessibility-experts-ride-with-waymo-ahead-of-its-london/).

---

## The Tech on the Roof

The most obvious thing about a Waymo is the hardware on top. That dome on the roof isn't decorative. It's packed with sensors that give the car a complete, 360-degree picture of everything around it.

![Close-up of the Waymo sensor dome on the roof of the Jaguar I-PACE](/assets/images/blog/waymo-review/sensor-dome.webp)

The [5th-generation Waymo Driver](https://waymo.com/blog/2020/03/introducing-5th-generation-waymo-driver/), which is what's in the Jaguar I-PACEs we rode, uses a combination of four lidar units, six radar sensors, and 29 cameras placed all around the vehicle. [Tangram Vision](https://www.tangramvision.com/blog/sensing-breakdown-waymo-jaguar-i-pace-robotaxi) did a fantastic breakdown of the full sensor layout if you want the technical detail.

### How Lidar Works

Lidar stands for Light Detection and Ranging. It works by firing millions of laser pulses in every direction and measuring how long each one takes to bounce back off objects. This builds a detailed 3D point cloud of everything within 300 metres of the car, updated in real time. Unlike cameras, lidar works just as well at night and isn't affected by glare, shadows, or low light conditions.

The main lidar unit sits on the roof in that distinctive dome. It handles the long-range view, scanning the road ahead and behind. Four perimeter lidar units are placed around the body of the car at different heights. These cover the close-range blind spots that the roof unit can't see — cyclists pulling up alongside, pedestrians stepping off the kerb, or objects low to the ground. [TechCrunch](https://techcrunch.com/2020/03/06/inside-the-next-gen-tech-on-waymos-self-driving-jaguar-i-pace/) described the perimeter units as providing "unparalleled coverage with a wide field of view" that helps the car navigate tight gaps in city traffic and hilly terrain.

### Radar and Cameras

The six radar sensors work differently from lidar. Radar uses radio waves instead of light, which means it can see through rain, fog, and dust. It's especially good at detecting the speed and direction of moving objects. Between the lidar's 3D mapping and radar's velocity tracking, the car knows exactly what's around it and where everything is heading.

The 29 cameras provide visual context that lidar and radar can't. They read traffic lights, identify road signs, recognise lane markings, and spot things like brake lights and turn signals on other vehicles. The cameras are placed in the front, back, sides, and on top of the vehicle to cover every angle.

### How the AI Puts It All Together

Instead of relying on GPS alone, which can lose signal between tall buildings, the Waymo Driver uses [highly detailed custom maps](https://waymo.com/waymo-driver/) matched with real-time sensor data. The AI takes all the data from the lidar, radar, and cameras, fuses it together, and builds a real-time understanding of the world. It can identify and track hundreds of objects at once — pedestrians, cyclists, other vehicles, construction zones, even a plastic bag blowing across the road — and predict what each one is likely to do next.

This prediction system is what makes the ride feel so smooth. The car doesn't just react to what's happening right now. It anticipates what's about to happen. That's why it starts slowing down before a pedestrian steps off the kerb, or moves over before a car ahead starts merging.

### What's Next: The 6th Generation

Waymo is already rolling out their [6th-generation Waymo Driver](https://waymo.com/blog/2024/08/meet-the-6th-generation-waymo-driver/) on a completely new vehicle platform — the [Waymo Ojai](https://en.wikipedia.org/wiki/Waymo_Ojai), built by Zeekr (a Geely subsidiary). The new system actually uses fewer sensors — 13 cameras down from 29, and three lidar units instead of four — but with better resolution and range. The new lidar can [see up to 500 metres](https://techannouncer.com/waymos-6th-generation-a-leap-forward-in-autonomous-vehicle-technology/), nearly double the previous generation. It also includes external audio receivers (EARs) that can hear emergency sirens and other important sounds. The Ojai has been [in service since February 2026](https://www.cnbc.com/2026/02/12/waymo-begins-deploying-next-gen-ojai-robotaxis-to-extend-its-us-lead.html).

---

## The Ride Experience

You open the Waymo app, set your pickup and drop-off, and a car is assigned. The app shows you the car approaching in real time. When it arrives, you unlock the doors through the app and get in.

![The Waymo dashboard greeting — "Good morning, Robert James"](/assets/images/blog/waymo-review/dashboard-greeting.webp)

Inside, there's a screen on the back of the front seats that shows your route, your estimated arrival, and a live view of what the car is "seeing" — other vehicles, lane markings, traffic lights. It's fascinating to watch. The screen greeted us by name when we got in, which was a nice touch.

The ride itself felt like being in a very competent Uber, minus the small talk. The car obeyed every speed limit, every stop sign, and every traffic light with zero ambiguity. It didn't tailgate. It didn't run yellows. On steep San Francisco hills, it handled the inclines and blind turns confidently.

We took rides at different times to stress-test it. Early morning was smooth, as you'd expect. Rush hour through the Financial District was the real test, and it handled the stop-and-go traffic, double-parked delivery trucks, and jaywalking pedestrians without any drama. The night ride was impressive too. The lidar doesn't care about lighting conditions, so the car drove just as confidently in the dark as it did at noon.

![The Waymo Jaguar I-PACE from the front — sensor dome and Jaguar badge visible](/assets/images/blog/waymo-review/waymo-front.webp)

![Rear view of the Waymo showing WAYMO branding and "Ride today" sticker](/assets/images/blog/waymo-review/waymo-rear.webp)

![Inside the Waymo — no driver, steering wheel untouched, navigation showing arrival time](/assets/images/blog/waymo-review/waymo-interior.webp)

---

## The Safety Numbers

We looked into the safety data before our trip, and it's one of the most compelling parts of the Waymo story.

A [peer-reviewed study published in the journal Traffic Injury Prevention](https://www.tandfonline.com/doi/full/10.1080/15389588.2025.2499887) compared Waymo's crash rates to human drivers across 56.7 million rider-only miles. The results are striking. Compared to an average human driver covering the same distance in the same cities, the Waymo Driver had [90% fewer serious injury crashes, 82% fewer airbag deployment crashes, and 81% fewer injury-causing crashes](https://waymo.com/safety/impact/).

The overall police-reported crash rate for Waymo is about 1.16 per million miles, compared to [6.95 per million miles for human drivers](https://www.eweek.com/news/waymo-driverless-cars-serious-crashes/). That's roughly six times safer.

These aren't cherry-picked numbers. Waymo publishes their [safety data publicly](https://waymo.com/safety/) and it's been independently analysed by researchers. Are there still incidents? Yes. Any vehicle on the road can be involved in a crash, especially when other human drivers are involved. But the trend is clear: the autonomous system is significantly safer than the average human behind the wheel.

Sitting in the back seat, you feel it. There's no distracted driving. No texting. No tiredness. No road rage. The car is always paying attention, always following the rules, and always giving pedestrians and cyclists the right of way.

---

## Accessibility: Where Waymo Gets It Right

This is the part we cared about most, and honestly, Waymo impressed us.

### For Riders Who Are Blind or Have Low Vision

The [National Federation of the Blind](https://waymo.com/community/articles/national-federation-of-the-blind/) has called Waymo a potential "game changer" for blind riders. The [American Council of the Blind](https://www.acb.org/i-am-blind-self-driving-cars-waymo-give-people-me-independence) published a piece titled "I am blind. Self-driving cars like Waymo give people like me independence." These aren't throwaway endorsements. These are the two largest blindness organisations in the United States saying this technology fundamentally changes what's possible for their communities.

Here's what Waymo has built for blind and low-vision riders, according to their [accessibility features page](https://support.google.com/waymo/answer/9566824?hl=en):

The app is built with full screen reader support — every button and element is properly labelled for VoiceOver on iOS and TalkBack on Android. That sounds basic, but it's not something you can say about most ride-hailing apps. We've tested enough apps in our accessibility work to know how rare this is.

When your car arrives, the app has a "Find my car" feature that gives turn-by-turn directions to the vehicle using visual, audio, and haptic cues. You can also set a preference to minimise walking distance at pickup. The car itself makes purpose-built sounds — a distinctive musical tone — so you can hear it approaching. For someone who can't see the car pulling up, this is a big deal.

Inside the car, assistive audio announces the start of the ride and key events along the way. You don't have to rely on the screen to know what's happening. The car tells you.

Bryan Bashin, CEO of the [LightHouse for the Blind and Visually Impaired](https://waymo.com/community/articles/lighthouse-for-the-blind-sf/) in San Francisco, has spoken about how Waymo is connecting blind people to their communities in ways that weren't possible before. Think about it — no more negotiating with a driver who's uncomfortable with a guide dog. No more cancelled rides. No more waiting for accessible public transit. Just open the app and go.

### For Riders Who Are Deaf or Hard of Hearing

Waymo offers visual alternatives to audio cues. You can activate the car's lights to flash when it arrives, so you don't have to rely on hearing the horn or the engine. There's also a setting to ensure the car pulls up on the same side of the street as you, reducing the need to cross traffic.

The in-car screen provides all the ride information visually, so deaf riders aren't missing anything by not hearing audio announcements. And because there's no driver, there's no awkward communication barrier. The app handles everything.

### For Riders Who Use Wheelchairs

Waymo offers [wheelchair-accessible vehicles](https://support.google.com/waymo/answer/10656347?hl=en) through the app. These are currently manually driven by a Waymo-trained driver, but they're integrated into the same booking flow. Wheelchair users aren't pushed to a separate service or a different app. They request a ride just like anyone else and select the accessibility option.

The [National Council on Independent Living](https://ncil.org/news/announcements/waymo-dc/) has welcomed Waymo's approach and advocates for inclusive innovation in autonomous transportation.

### The Waymo Accessibility Network

Waymo didn't build these features in isolation. They created the [Waymo Accessibility Network](https://waymo.com/waymo-accessibility-network/), a group of 13 disability organisations that actively advise on the product. Members include the American Association of People with Disabilities, United Spinal Association, the Blinded Veterans Association, the American Council of the Blind, the Foundation for Blind Children, and others.

These aren't sponsorship deals. These organisations are involved in product development, testing, and feedback. The U.S. Department of Transportation [recognised this work](https://waymo.com/community/articles/waymos-accessibility-work-with-advocates-recognized-by-usdot/) through their Inclusive Design Challenge.

Waymo also published a piece about [what people who are blind actually want](https://waymo.com/community/articles/advocates-share-what-people-who-are-blind-want-from-autonomous-driving/) from autonomous driving technology. The fact that they asked the question, and published the answers, says a lot about their approach.

As someone who works in accessibility every day, it's refreshing to see a tech company actually build with the disability community rather than just for them. Too many companies treat accessibility as a checkbox. Waymo is treating it as a core design principle.

---

## The One Thing They Need to Fix

We have one genuine criticism, and it's worth talking about because it directly affects accessibility.

When the Waymo can't find a spot right in front of your pickup location, it parks nearby. And "nearby" can mean around the corner or halfway down the block. The app tells you where the car is, but the notification doesn't give you much time or clarity about where exactly it's stopped.

For most people, this is a minor annoyance. You look around, spot the white Jaguar, and walk to it. But for someone who is blind, has low vision, or has limited mobility, this is a real problem. If the car is around a corner and you can't see it, you're relying entirely on the app's audio directions and the car's sounds to find it. And in a noisy city like San Francisco, with traffic, construction, and street noise, that's not always enough.

Waymo does have the "minimise walking distance" setting, and the musical cues help. But we think there's room for improvement here. A longer wait time before the car moves on. Clearer, more specific audio guidance when the car parks somewhere unexpected ("Your Waymo is 40 metres to your left, around the corner on Pine Street"). Maybe even a slow drive-by so the rider can hear it approach before it stops. Or a way for the rider to signal the car to honk again.

This is the kind of thing that separates good accessibility from great accessibility. The foundations are there. The feature just needs more polish for the edge cases that matter most to disabled riders. We hope Waymo is already working on it, and given how seriously they take accessibility feedback, we'd bet they are.

---

## What This Means for the Future

We left San Francisco genuinely excited about what Waymo represents. Not just as a tech product, but as a mobility tool.

Think about what autonomous ride-hailing means for people who can't drive. People who are blind. People with epilepsy. Older adults who've had to give up their licence. People in wheelchairs who've been refused rides by human drivers — [which happens more often than you'd think](https://www.sfexaminer.com/forum/waymo-sf-disability-community-essential/article_9da7d8bb-1ab3-4be9-ae28-7f4f4f989a0b.html). People who live in areas with limited public transit. People who can't afford to own a car but need reliable transport to get to work, medical appointments, or the grocery store.

A self-driving car doesn't judge. It doesn't refuse your guide dog. It doesn't decide your wheelchair is too much hassle. It doesn't cancel on you because you're going to a neighbourhood the driver doesn't like. It just takes you where you need to go. That's a powerful thing.

Waymo is [already working with UK safety and accessibility experts](https://waymo.com/community/articles/uk-safety-and-accessibility-experts-ride-with-waymo-ahead-of-its-london/) ahead of their London launch, including the Royal National Institute of Blind People (RNIB) and Guide Dogs UK. The fact that accessibility is part of the conversation from day one, not bolted on after launch, gives us a lot of confidence in where this is heading.

And with the [6th-generation vehicles](https://www.cnbc.com/2026/02/12/waymo-begins-deploying-next-gen-ojai-robotaxis-to-extend-its-us-lead.html) now on the road, the tech is only getting better. Better sensors, longer range, lower cost. The trajectory is clear.

---

## Our Verdict

The tech is remarkable. The ride is smooth, safe, and genuinely impressive. The [safety data](https://waymo.com/safety/impact/) speaks for itself — 90% fewer serious crashes than human drivers. The accessibility work is some of the best we've seen from any transport company, and the involvement of 13 disability organisations in the product development process isn't something we've seen anywhere else.

The one weak spot — pickup clarity when the car can't park right next to you — is fixable and directly affects the riders who need this technology the most. We hope Waymo keeps pushing on that.

If you're in San Francisco, Phoenix, Los Angeles, or Austin, try it. And if you work in accessibility, pay attention to what Waymo is doing. They're setting a standard that the rest of the industry should be following.

![WAYMO branding on the side of the Jaguar I-PACE](/assets/images/blog/waymo-review/waymo-side.webp)

---

*Robert James Gabriel is the founder of Coffee & Fun LLC and creator of Helperbird, a browser extension that makes the web more accessible. He has been developing and publishing accessibility tools for over 15 years.*

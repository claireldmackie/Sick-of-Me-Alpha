# SICK OF ME -- Prototype Script

> **Last Updated:** March 11, 2026
> This document reflects the current state of the game prototype as built in code.
> It is the source of truth for scene flow, dialogue, interactions, and branching.

---

## CHARACTERS

- **Hero** -- The protagonist. Withdrawn, grieving, reluctant to engage.
- **Parent** -- Hero's mother. Found asleep in the living room.
- **Erma** -- A neighbour. Blunt, practical, slightly judgmental but well-meaning.
- **Jeff** -- A guy waiting at the bus stop. Optimistic but defeated.
- **Veronica** -- Runs the convenience store. Chatty, self-absorbed, but observant.
- **Cat** -- The town cat. Sits outside the store.
- **Drew** -- A strange, cryptic person found standing in the road.
- **Lady** -- A smoking woman on the street. Wise, world-weary, direct.
- **Calvin** -- An older man at the bridge. Drinks, reminisces, lonely.
- **Tree People** -- Two figures hanging out in a tree in the forest.
- **[Friend]** -- Hero's deceased best friend, referenced in letters. Never seen in-game.

---

## COLLECTIBLE LETTERS

Letters are collected throughout the game and can be re-read from the envelope icon in the HUD.

### Letter #1 (Collected: Scene 4 -- House Lane)
> Dear [Hero],
>
> Writing letters kinda makes me feel like I'm a sickly Victorian child communicating to my favourite pen pal across the sea. It's okay though, I kind of dig it.
>
> The other day I ran into Veronica at the Bello-eleven. She complained at length about how she thinks the cat drives away customers. How could a cutie like that scare people?? I think she's the one that's driving away the customers, don't tell her I said that though.
>
> I hope I see you soon.
>
> Love,
> [Friend]

### Letter #2 -- Bill (Collected: Scene 16 -- Town After Store)
> **BILL, OVERDUE**
> *(Displayed as large red text on the letter UI)*

### Letter #3 (Collected: Scene 16 -- Town After Store)
> Dear [Hero],
>
> I had so much fun at the bridge, I wasn't expecting you to visit me. I don't feel very good today, but I'm probably just tired from being out for so long. It does suck that our secret spot has become so mainstream... Get it? Cause it's by a stream? Yup, you get it.
>
> It's nice to have everyone else there, but sometimes, I miss when it was just us. They don't get my jokes like you do. I like Calvin though, he's a nice guy. He looks all grumpy but really, he's just old. If I were as old as him, I think I'd be pretty grumpy. I think he likes us though, probably cause we're the coolest people in this town.
>
> Also, whenever you get a chance, you should write me a letter back. Give me something to look forward to.
>
> Love,
> [Friend]

### Letter #4 (Collected: Scene 20 -- End of Bridge)
> Dear [Hero],
>
> I know recitals are boring, but I thought you were going to stop by.
>
> I'm not that good at piano, but one day I will be, and you will have missed my uprising. I might not even bring you on tour with me when I'm famous.
>
> It's funny, we live down the street from each other, but I never see you anymore.
>
> You do this a lot. You know you can talk to me, right? If somethings wrong... If nothing is wrong, then you are just being a dick.
>
> Sometimes I can't understand you.
>
> [Friend]

### Letter #5 (Collected: Scene 21 -- Forest)
> You finally sent me a letter back. You didn't really answer anything I said, but at least I feel like less of a creepy stalker now, so thanks...
>
> Sorry about my attitude in my last letter... if you even read it. I don't get why you don't come see me more.
>
> I know you don't like opening up, and I know your emo demeanour is appropriate given what you go through. Is that why I've been seeing less of you? or is it something else. I wish you'd just tell me.
>
> You know, we would be unstoppable if there wasn't so much road between us. I'll get my bike fixed up eventually.
>
> Love,
> [Friend]
>
> P.S. Going to skip the clinic today, the new one is so far away, and what could he tell me that's new anyway.

### Hero's Letter (Collected: Scene 22 -- Grave)
> Dear [Friend]
>
> I'm sorry I left you for so long. This place reminds me of how I used to be, I felt so trapped I didn't know what to do. I can't seem to move past anything that's happened.
>
> I wish you got to know me enough to be sick of me. Terribly and horribly sick of me. But I lost you, and now I seem to be losing myself. But you never asked me to be perfect. You just asked me to be there.
>
> Sometimes I feel like I can hear you, telling me to get off my miserable ass and make some kind of change. If you were still here, you wouldn't be wasting away like I am. You'd call me dramatic. You'd remind me that I'm not the main character in everyone's story, not even yours.
>
> I miss you.
>
> Love,
> [Hero]

---

## SCENE FLOW

```
Scene 1 (Bedroom)
  --> Scene 1.5 (Stairwell)
    --> Scene 2 (Living Room)
      --> Scene 3 (House Exterior)
        --> Scene 4 (House Lane)
          --> Scene 5 (Dirt Path)
            --> Scene 6 (Neighbour's Lane)
              --> Scene 7 (Cows)
                --> Scene 8 (Dirt Road 2)
                  --> Scene 9 (Bus Stop)
                    --> Scene 10 (Town Entrance)
                      --> Scene 11 (Town)
                        --> Scene 12 (Convenience Store)
                          --> Scene 13 (Store Shelves)
                            --> Scene 14 (Store Counter)
                              --> Scene 15 (Convenience Store Cont.)
                                --> Scene 16 (Town After Store)
                                  --> Scene 17 (Town Continued -- Drew)
                                    --> Scene 18 (Town Continued -- Lady)
                                      --> Scene 19 (Front of Bridge -- Calvin)
                                        --> Scene 20 (End of Bridge)
                                          --> Scene 21 (Forest)
                                            --> Scene 22 (Grave -- Branching Choices)
                                              --> Ending A: "Connect" (scene20a)
                                              --> Ending B: "Leave" (scene20b)
                                              --> Ending C: "Reflect" (scene20c)
```

---

## SCENES

---

### SCENE 1 -- BEDROOM
**File:** `scene1.json` | **Background:** bg-1.png
**Setting:** Hero's bedroom. Dark, messy. Hero is in bed.

**Characters on screen:** Hero (hidden initially)
**Interactive objects:** Curtain (hotspot), Door (hotspot), Door Arrow (hidden initially)

**Sequence:**

1. **Hero:** "Hhmm..."
2. *[Pause -- 800ms]*
3. **Unknown:** "\*Thump thump thump\*"
4. **Hero:** "..."
5. **Unknown:** "Hello? \*Thump thump thump\*"
6. **Unknown:** "I know you're in there."
7. **Hero:** "Five more minutes won't matter..."
8. **Unknown:** "..."
9. **Unknown:** "Are you ignoring me?"
10. **Hero:** "They'll give up eventually..."
11. **Unknown:** "COME OUTSIDE, I WANT TO TALK! \*Thump thump thump\*"
12. *[Hero sprite appears]*
13. **Hero:** "Mom probably ordered dinner."
14. **>>> PLAYER CLICKS: Curtain**
15. **Hero:** "I should really clean those..."
16. *[Tutorial prompt appears: "Use A and D or Arrow Keys to move"]*
17. *[Door arrow appears]*
18. **>>> PLAYER CLICKS/WALKS TO: Door Arrow**
19. *[Transition to next scene]*

---

### SCENE 1.5 -- STAIRWELL
**File:** `scene1-5.json` | **Background:** bg-1-5.png
**Setting:** Top of the stairwell, looking down.

**Characters on screen:** None
**Interactive objects:** Stairs Arrow (visible, pointing up)

**Sequence:**

1. **>>> PLAYER CLICKS: Stairs Arrow**
2. *[Transition to next scene]*

---

### SCENE 2 -- LIVING ROOM
**File:** `scene2.json` | **Background:** bg-2.png
**Setting:** Dark living room. TV glow illuminates the room. Mom asleep in a chair.

**Visual state:** Dark overlay (55% opacity) with TV glow effect centred at (300, 600).
**Characters on screen:** Hero (visible), Parent (visible, interactive)
**Interactive objects:** Chair (non-interactive image object), Lamp (interactive image object), Door (hotspot)

**Sequence:**

1. **>>> PLAYER CLICKS: Parent**
2. **Hero:** "..."
3. *[Close-up of Mom appears]*
4. **Parent:** "zzzssnorhhhhh"
5. **Hero:** "I didn't need to see that..."
6. *[Close-up hides]*
7. **Unknown:** "\*Thump thump\*"
8. **>>> PLAYER CLICKS: Lamp**
9. **Hero:** "Hm, it's broken."
10. **>>> PLAYER CLICKS: Door**
11. *[Pause -- 500ms]*
12. *[Transition to next scene]*

---

### SCENE 3 -- HOUSE EXTERIOR
**File:** `scene3.json` | **Background:** bg-3.png
**Setting:** Outside Hero's house. Erma is standing in the yard.

**Characters on screen:** Hero (visible, flipped/facing left, smaller scale 0.52), Erma (visible, interactive)
**Interactive objects:** Next Arrow (hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Erma**
2. **Erma:** "Look who finally decided to come outside."
3. **Erma:** "Well...? Aren't you going to say anything?"
4. **Hero:** "You're not dinner..."
5. **Erma:** "???"
6. **Hero:** "Never mind."
7. **Erma:** "Right..."
8. **Erma:** "You know, you've really let this place go. We all have responsibilities to uphold, even if we don't feel like it. Everyone in town is doing their best, you could put in more effort to help."
9. **Hero:** "..."
10. **Erma:** "Your yard is a bit of an eyesore, are you going to do something about it?"
11. **Erma:** "You could start by doing something about that mailbox of yours."
12. **Hero:** "You're right."
13. **Erma:** "Veronica has been asking about you, maybe you should talk to her while you're up."
14. **Hero:** "..."
15. **Erma:** "Anyway, nice to see you up and about..."
16. **Hero:** "Yeah, thanks."
17. *[Background music begins -- gentle 4-second fade-in]*
18. *[Next arrow appears]*
18. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
19. *[Transition to next scene]*

---

### SCENE 4 -- HOUSE LANE
**File:** `scene4.json` | **Background:** bg-4.png
**Setting:** The lane outside Hero's house. Mailbox is visible.

**Characters on screen:** Hero (visible)
**Interactive objects:** Mailbox Closed (visible, interactive), Mailbox Open (hidden), Mailbox Letters (hidden), Next Arrow (hidden)

**Sequence:**

1. **>>> PLAYER CLICKS: Mailbox**
2. *[Mailbox closed hides, mailbox open appears, letters pile appears]*
3. **>>> PLAYER CLICKS: Mailbox Letters**
4. *[Letter #1 is collected and displayed to player]*
5. **Hero:** "..."
6. **Hero:** "So many god damn letters."
7. **Hero:** "..."
8. **Hero:** "I guess I should go to the store."
9. *[Next arrow appears]*
10. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
11. *[Transition to next scene]*

---

### SCENE 5 -- DIRT PATH
**File:** `scene5.json` | **Background:** bg-5.png
**Setting:** A dirt path between houses. Erma is here again.

**Characters on screen:** Hero (visible), Erma (visible, interactive)
**Interactive objects:** Next Arrow (hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Erma**
2. **Erma:** "Today's Tuesday... Tuesdays used to be my favourite day."
3. **Hero:** "..."
4. **Erma:** "The tea might get cold."
5. *[Next arrow appears]*
6. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
7. *[Transition to next scene]*

---

### SCENE 6 -- NEIGHBOUR'S LANE
**File:** `scene6.json` | **Background:** bg-6.png
**Setting:** A lane with neighbouring houses. No interactions -- just passing through.

**Characters on screen:** Hero (visible)
**Interactive objects:** Next Arrow (appears immediately)

**Sequence:**

1. *[Next arrow appears immediately]*
2. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
3. *[Transition to next scene]*

---

### SCENE 7 -- COWS
**File:** `scene7.json` | **Background:** bg-7.png
**Setting:** A field with cows staring at Hero.

**Characters on screen:** Hero (visible)
**Interactive objects:** Cows (hotspot), Next Arrow (hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Cows**
2. **Hero:** "Why does everyone always look at me like that?"
3. *[Next arrow appears]*
4. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
5. *[Transition to next scene]*

---

### SCENE 8 -- DIRT ROAD 2
**File:** `scene8.json` | **Background:** bg-8.png
**Setting:** Another stretch of dirt road. A statue is visible.

**Characters on screen:** Hero (visible)
**Interactive objects:** Statue (hotspot), Next Arrow (hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Statue**
2. **Hero:** "Nobody wants to see that thing, who even put it here?"
3. *[Next arrow appears]*
4. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
5. *[Transition to next scene]*

---

### SCENE 9 -- BUS STOP
**File:** `scene9.json` | **Background:** bg-9.png
**Setting:** A bus stop. Jeff is sitting with a backpack, waiting.

**Characters on screen:** Hero (visible, zIndex 5), Jeff (visible, interactive, scale 0.65)
**Interactive objects:** Backpack (hotspot), Next Arrow (hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Backpack**
2. **Hero:** "I'm scared to know what's in there."
3. **>>> PLAYER CLICKS: Jeff**
4. **Jeff:** "I'm waiting for the bus..."
5. **Hero:** "I can see that."
6. **Jeff:** "I'm supposed to meet my girlfriend for lunch."
7. **Jeff:** "A bus drove past me a couple hours ago, do you think there will be another one?"
8. **Hero:** "..."
9. **Jeff:** "\*Sighs and hunches over in defeat\*"
10. **Jeff:** "You're right... wishful thinking."
11. *[Next arrow appears]*
12. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
13. *[Transition to next scene]*

---

### SCENE 10 -- TOWN ENTRANCE
**File:** `scene10.json` | **Background:** bg-10.png
**Setting:** Entrance to the town. The town cat sits outside.

**Characters on screen:** Hero (visible, zIndex 6)
**Interactive objects:** Cat Sitting (image, visible), Cat Leg-Up (hidden), Cat Cleaning (hidden), Next Arrow (hidden)

**Sequence:**

1. **>>> PLAYER CLICKS: Cat**
2. **Hero:** "What a warm welcome to the town."
3. **Cat:** "..."
4. **Hero:** "Don't look at me like that..."
5. *[Cat sitting hides, cat leg-up appears]*
6. *[Pause -- 800ms]*
7. **Hero:** "You always see right through me, huh?"
8. *[Cat leg-up hides, cat cleaning appears]*
9. **Cat:** "\*digs toes\*"
10. *[Next arrow appears]*
11. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
12. *[Transition to next scene]*

---

### SCENE 11 -- TOWN
**File:** `scene11.json` | **Background:** bg-11.png
**Setting:** The main town area. A store is visible.

**Characters on screen:** Hero (visible)
**Interactive objects:** Store (hotspot)

**Sequence:**

1. **>>> PLAYER CLICKS: Store**
2. *[Transition to next scene]*

---

### SCENE 12 -- CONVENIENCE STORE
**File:** `scene12.json` | **Background:** bg-12.png | **Fade:** 1000ms (slow fade in)
**Setting:** Inside the convenience store. Veronica is sitting on the floor.

**Characters on screen:** Hero (visible)
**Interactive objects:** Girl/Veronica (hotspot)

**Sequence:**

1. **>>> PLAYER CLICKS: Veronica**
2. **Hero:** "Is she okay?"
3. *[Pause -- 800ms]*
4. **Veronica:** "Oh, hey [Hero]! Didn't see you there!"
5. **Veronica:** "It's been a while... I guess we've never really talked one on one, have we?"
6. **Hero:** "I-"
7. **Veronica:** "How have you been? Personally, I love my life. Some would say I'm thriving."
8. **Hero:** "..."
9. **Veronica:** "But it has been feeling pretty desolate around here lately. I think everyone is going crazy or something."
10. **Hero:** "Mhm."
11. **Veronica:** "You know how it is in this town, when part of our routine is changed everyone gets unsettled. It's easy for things to feel like their falling apart when no one's around to pick up the pieces. Maybe if you hadn't up and disappeared like you did..."
12. *[Pause -- 1000ms]*
13. **Veronica:** "I forgive you though, I have a generous spirit."
14. **Veronica:** "...or so people say!"
15. **Hero:** "It's pretty dirty in here."
16. **Veronica:** "Oh? Yeah, I guess it is... I hadn't noticed."
17. **Veronica:** "Anyway, what can I get for you?"
18. **Hero:** "I'd like some flowers."
19. **Veronica:** "Sure, have a look around."
20. *[Transition to next scene]*

---

### SCENE 13 -- STORE SHELVES
**File:** `scene13.json` | **Background:** bg-13.png
**Setting:** Inside the store, browsing shelves.

**Characters on screen:** None
**Interactive objects:** Flowers (hotspot), Snack (hotspot, hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Flowers**
2. **Hero:** "These will have to do... I should probably get a snack too."
3. *[Snack hotspot appears]*
4. **>>> PLAYER CLICKS: Snack**
5. *[Transition to next scene]*

---

### SCENE 14 -- STORE (COUNTER)
**File:** `scene14.json` | **Background:** bg-14.png
**Setting:** At the store counter, checking out.

**Characters on screen:** Hero (visible)
**Interactive objects:** Counter (hotspot)

**Sequence:**

1. **>>> PLAYER CLICKS: Counter**
2. **Hero:** "I think that's all I need."
3. *[Transition to next scene]*

---

### SCENE 15 -- CONVENIENCE STORE (CONT.)
**File:** `scene15.json` | **Background:** bg-12.png (same as scene 12)
**Setting:** Back at the front of the store. Veronica is still on the floor.

**Characters on screen:** Hero (visible)
**Interactive objects:** Girl/Veronica (hotspot), Doors (hotspot, hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Veronica**
2. **Veronica:** "Hey [Hero]"
3. **Hero:** "Hm?"
4. **Veronica:** "We had a party out by the bridge like we usually do, but with the routine all out of whack it was a mess! Calvin was there and he was droning on and on, worse than usual. And there was nobody to send out invitations, so everyone showed up at different times."
5. **Hero:** "Sounds hectic."
6. **Veronica:** "Very. It's easy for the equilibrium around here to get thrown off, you know that right? I know you know that, but I guess it didn't stop you from going off on your own."
7. **Hero:** "..."
8. **Veronica:** "Anyway, it's fine. Even if the party sucked don't worry about it, really."
9. **Veronica:** "..."
10. **Veronica:** "Speaking of Calvin, he still has your bag and everything you left by the bridge. You were in such a hurry to leave, can't blame you though. Are you going to pick it up?"
11. **Hero:** "Yeah, I will. I forgot about that."
12. **Veronica:** "..."
13. **Veronica:** "Well, it was nice talking to you."
14. **Hero:** "Are you going to get up?"
15. **Veronica:** "I could, if I wanted to... but I don't want to. I'm not stuck just comfy, y'know?"
16. *[Doors hotspot appears]*
17. **>>> PLAYER CLICKS: Doors**
18. *[Transition to next scene]*

---

### SCENE 16 -- TOWN (AFTER STORE)
**File:** `scene16.json` | **Background:** bg-16.png
**Setting:** Back in town after leaving the store. A mailbox/bill and a closed clinic.

**Characters on screen:** Hero (visible)
**Interactive objects:** Clinic (hotspot, hidden initially), Next Arrow (hidden initially)

**Sequence:**

1. **Hero:** "..."
2. *[Letter #2 (Bill) is collected -- "BILL, OVERDUE" displayed in large red text on letter UI]*
3. **Hero:** "\*sigh\* I'm not going to read that one yet..."
4. *[Letter #3 is collected and displayed to player]*
5. **Hero:** "How many of these did I miss?"
8. *[Clinic hotspot appears]*
9. **>>> PLAYER CLICKS: Clinic**
10. **Hero:** "When did the clinic shut down?"
11. *[Next arrow appears]*
12. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
13. *[Transition to next scene]*

---

### SCENE 17 -- TOWN CONTINUED (DREW)
**File:** `scene17.json` | **Background:** bg-17.png
**Setting:** Further down the town street. Drew is standing in the middle of the road.

**Characters on screen:** Hero (visible)
**Interactive objects:** Drew (hotspot), Next Arrow (hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Drew**
2. **Hero:** "Why are you in the road?"
3. **Drew:** "..."
4. **Hero:** "Hello?"
5. **Drew:** "..."
6. **Drew:** "This is so like you."
7. **Hero:** "???"
8. **Drew:** "Heh..."
9. **Drew:** "This is so you."
10. **Drew:** "..."
11. **Drew:** "You when you walked up to me."
12. **Drew:** "..."
13. **Drew:** "Me right now."
14. **Drew:** "..."
15. **Drew:** "Us thirty seconds ago."
16. **Hero:** "Do you have anything else to say??"
17. **Drew:** "I can't afford groceries this month."
18. *[Next arrow appears]*
19. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
20. *[Transition to next scene]*

---

### SCENE 18 -- TOWN CONTINUED (LADY)
**File:** `scene18.json` | **Background:** bg-18.png
**Setting:** Further down the street. A woman is smoking.

**Characters on screen:** Hero (visible)
**Interactive objects:** Lady (hotspot), Next Arrow (hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Lady**
2. **Hero:** "Isn't that bad for you?"
3. **Lady:** "Yeah, but hell, what are you gonna do."
4. **Hero:** "Could I have some?"
5. **Lady:** "No sweetie, you don't want to end up like me, all washed up and nowhere to go. I used to be quite a looker, still am, but I draw a different crowd now."
6. **Lady:** "I'll tell you, I've been smoking a lot more lately. It feels like there's nothing to do this town, it's lost a lot of its spirit. Talking to all these lame-o's is such a drag, it's draining my life force... You know what I mean?"
7. **Hero:** "Yeah, I do."
8. **Lady:** "You look so sad all on your own, it's a whole without a half, isn't it?"
9. **Hero:** "I guess."
10. **Lady:** "I went to the party by the bridge... won't be doing that again."
11. **Hero:** "Veronica said it was \"all out of whack\"."
12. **Lady:** "That's one way of putting it."
13. **Lady:** "I think people are having a harder time coping these days. Everybody has some kind of distraction, something to obsess over. No one's really helping since you left."
14. **Hero:** "..."
15. **Lady:** "It's not very fair, is it..?"
16. **Hero:** "I'm sorry."
17. **Lady:** "It's not your fault. Too many people stop trying to do anything about the situation they're in because they feel like nothing they do matters."
18. **Lady:** "Can one person really make a difference?"
19. **Hero:** "You've made a difference to me."
20. **Lady:** "Then you already know the answer, don't you? We can't save everyone. But we can show up."
21. **Lady:** "I rely on you a lot, as well. Whether I like it or not. I do, really..."
22. **Hero:** "I know."
23. **Lady:** "Thank you..."
24. **Hero:** "For what?"
25. **Lady:** "Listening to me."
26. *[Next arrow appears]*
27. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
28. *[Transition to next scene]*

---

### SCENE 19 -- FRONT OF BRIDGE (CALVIN)
**File:** `scene19.json` | **Background:** bg-19.png | **Fade:** 1000ms (slow fade in)
**Setting:** The front of the bridge. Calvin is here with a drink.

**Characters on screen:** Hero (visible)
**Interactive objects:** Calvin (hotspot), Next Arrow (hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Calvin**
2. **Calvin:** "...Heyy \*burp\*"
3. **Hero:** "Hey Calvin."
4. **Calvin:** "Here's your bag. I've had it for... a while now. Sorry, it's a bit soggy."
5. **Hero:** "Thank you."
6. **Calvin:** "Found suh-some old photos \*urppp\* in my house..."
7. **Calvin:** "Take a look."
8. *[Close-up appears (no image)]*
9. *[Close-up text: "Faded photos of two young men laughing."]*
10. *[Close-up hides]*
11. **Calvin:** "It's me and an old friend of m-mine..."
12. **Calvin:** "That's what I looked like back in the day"
13. **Hero:** "..."
14. **Calvin:** "I don't feel like I fit in this town very much sometimes... \*urrp\*"
15. **Calvin:** "Sometimes.... you get it"
16. **Hero:** "I think you fit in just right."
17. **Calvin:** "Now I do, now I do..."
18. **Calvin:** "Wasn't always like that."
19. **Hero:** "You think I could get past you?"
20. **Calvin:** "Oh yeah, yeah... Sorry."
21. **Calvin:** "Come by again sometime."
22. **Hero:** "Maybe, Calvin."
23. *[Next arrow appears]*
24. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
25. *[Transition to next scene]*

---

### SCENE 20 -- END OF BRIDGE
**File:** `scene20.json` | **Background:** bg-20.png
**Setting:** The far end of the bridge.

**Characters on screen:** Hero (visible)
**Interactive objects:** Next Arrow (hidden initially)

**Sequence:**

1. **Hero:** "..."
2. *[Letter #3 is collected and displayed to player]*
3. *[Next arrow appears]*
4. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
5. *[Transition to next scene]*

---

### SCENE 21 -- FOREST
**File:** `scene21.json` | **Background:** bg-21.png
**Setting:** A dark forest path. People are sitting in a tree.

**Characters on screen:** Hero (visible)
**Interactive objects:** Tree Creatures (hotspot), Bush (hotspot, hidden initially), Next Arrow (hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Tree People**
2. **Tree People:** "Sup."
3. **Tree People:** "How's it hangin'?"
4. **Hero:** "I'm not the one in a tree..."
5. **Tree People:** "Heh, yeah."
6. **Tree People:** "Where are ya running off to at this hour?"
7. **Hero:** "..."
8. **Tree People:** "Ahhh the silent type... Well, we won't pry anymore."
9. **Tree People:** "Have a good night, don't stay out too long."
10. **Hero:** "Thanks."
11. **Hero:** "..."
12. *[Letter #4 is collected and displayed to player]*
13. **Hero:** "No going back now..."
14. *[Bush hotspot appears]*
15. **>>> PLAYER CLICKS: Bush**
16. *[Next arrow appears]*
17. **>>> PLAYER CLICKS/WALKS TO: Next Arrow**
18. *[Transition to next scene]*

---

### SCENE 22 -- GRAVE (BRANCHING CHOICES)
**File:** `scene22.json` | **Background:** bg-22.png | **Fade:** 1000ms (slow fade in)
**Setting:** A gravesite in the woods. [Friend]'s grave. A basket of items left by townspeople.

**Characters on screen:** Hero (visible, positioned at x:600)
**Interactive objects:** Grave (hotspot), Basket (hotspot, hidden initially), Grave Letter (hotspot, hidden initially)

**Sequence:**

1. **>>> PLAYER CLICKS: Grave**
2. **Hero:** "These are for you... It's your favourite flavour."
3. *[Basket appears]*
4. **>>> PLAYER CLICKS: Basket**
5. **Hero:** "Everyone in town left stuff here for me while I was gone..."
6. *[Grave letter hotspot appears]*
7. **>>> PLAYER CLICKS: Grave Letter**
8. **Hero:** "I wrote a letter for you..."
9. *[Hero's Letter is collected and displayed to player]*
10. **Hero:** "I wrote you a letter explaining how I feel, but now it all feels wrong."
11. **Hero:** "It's different when I'm sitting here, I have to face the fact that you're really gone."

**--- BRANCHING DIALOGUE BEGINS ---**

Each choice below has three options. Each option is tagged with a category: **connect**, **leave**, or **reflect**. The ending is determined by whichever category the player picks the most across all five questions.

**Choice 1:**
> **Hero:** "I haven't visited you in a month. I think I felt..."
- **"Guilty..."** --> "Sitting by your grave now that you're gone. I should have been there for you more while you were here." *(connect)*
- **"Helpless..."** --> "You're gone and there is nothing I can do to change that. Everything feels so out of my control." *(leave)*
- **"Angry..."** --> "You knew you were sick and you acted like everything was fine. I wish you took it more seriously." *(reflect)*

**Choice 2:**
> **Hero:** "When you were still here, I wish I had..."
- **"Told you how I was feeling..."** --> "I always felt like I should deal with my problems on my own, you had more to deal with." *(reflect)*
- **"Spent more time with you..."** --> "I wasted the time I had left not knowing it would be gone." *(connect)*
- **"Read the letters you sent..."** --> "I could've done something or at least given you what you asked for." *(leave)*

**Choice 3:**
> **Hero:** "It took a long time for me to get the courage to go back to the town again. I was worried that they..."
- **"Would blame me..."** --> "I left for so long. I wasn't there to help you and I wasn't there to help them move on." *(leave)*
- **"Would pity me..."** --> "I don't need that. I don't want people to look at me differently." *(reflect)*
- **"Would move on..."** --> "I felt so stuck. I couldn't face the change. It hurt to see the town without you." *(connect)*

**Choice 4:**
> **Hero:** "When I finally went outside, the town..."
- **"Wasn't very supportive..."** --> "It felt like they blamed me for everything falling apart. What was I supposed to do anyway?" *(leave)*
- **"Tried to support me..."** --> "They pushed me to keep going, I don't think I would have gotten the courage to visit without them." *(connect)*
- **"Supported me where they could..."** --> "They talked to me like everything was normal, they even left me some stuff by your grave." *(reflect)*

**Choice 5:**
> **Hero:** "I need to figure out how to live without you. I think the only way I can do that is by..."
- **"Connecting more with the community..."** --> "I'm going to try and move on in your absence. I've learned that life keeps moving even when I can't, and I want to be there for people." *(connect)*
- **"Moving somewhere and keep living..."** --> "I need to get out of here. I don't think I can move past anything, living in that house and living without you feels so lonely." *(leave)*
- **"Taking more time to reflect..."** --> "Everything feels like too much, I just want to sleep. I feel like everyone's relying on me and I don't know what to do." *(reflect)*

**--- BRANCHING DIALOGUE ENDS ---**

12. **Hero:** "I'm going to miss you."
13. *[Ending is determined based on majority category]*
14. *[Transition to ending scene]*

---

## ENDINGS

All three endings show a final background image, pause for 3 seconds, then show a credits overlay. After credits close, the player returns to the homepage.

### ENDING A -- CONNECT (scene20a)
**File:** `scene20a.json` | **Background:** bg-20a.png
**Setting:** TBD visual. No characters on screen.
*Hero chose to reconnect with the community.*

### ENDING B -- LEAVE (scene20b)
**File:** `scene20b.json` | **Background:** bg-20b.png
**Setting:** TBD visual. Hero is visible, centred on screen.
*Hero chose to leave the town and start over elsewhere.*

### ENDING C -- REFLECT (scene20c)
**File:** `scene20c.json` | **Background:** bg-20c.png
**Setting:** TBD visual. No characters on screen.
*Hero chose to take more time to process and reflect.*

---

## GAME MECHANICS

### Music
- Background music (`sick of me_mixdown.mp3`) begins after the Erma dialogue in Scene 3 (House Exterior)
- Fades in gently over 4 seconds
- Loops continuously through the rest of the game
- Volume is adjustable via the slider in the pause menu
- Music stops when quitting to the main menu or resetting

### Movement
- Player can move Hero left/right using **A/D** or **Arrow Keys**
- Walking to the screen edge triggers the next-scene arrow if one is active
- Speed: 7px per frame

### Backward Navigation
- Outdoor scenes form a linear chain: House Ext (3) → House Lane (4) → Dirt Path (5) → Neighbour's (6) → Cows (7) → Dirt Road (8) → Bus Stop (9) → Town Entrance (10) → Town (11) → [store 12-15 skipped] → After Store (16) → Drew (17) → Lady (18) → Bridge (19) → End Bridge (20) → Forest (21)
- Walking left off-screen in any outdoor scene returns to the previous outdoor scene
- Going back from scene 16 jumps to scene 11 (skipping store interiors)
- Scene 3 is the earliest -- cannot go further back
- Scene 22 (Grave) is excluded from backward navigation
- All previously completed interactions stay completed when revisiting scenes
- Completed scenes load in "browsing mode" (no sequence replay, just the final visual state)
- Partially completed scenes resume from where the player left off
- Backward navigation is blocked during dialogue, close-ups, letter viewing, or open menus
- Scene progress is saved alongside other save data and persists across save/load

### Interaction
- Clickable objects glow when hovered (white rounded rectangle outline)
- The sequence enforces a strict order: players must click the correct target before the story progresses
- Arrows (dashed outline chevrons) serve as navigation markers

### Dialogue System
- Dialogue appears in a box at the bottom of the screen with speaker name
- Player clicks anywhere to advance dialogue
- Skip button appears when 3+ consecutive dialogue lines remain
- Close-up dialogue can show character images or text/HTML content

### Letter System
- Letters are collected at specific story moments and shown in a full-screen viewer
- Collected letters can be re-read anytime via the envelope HUD icon
- Letters are navigated with left/right arrows in the viewer

### Save System
- 3 save slots
- Saves store: scene index, sequence step index, scene name, collected letter IDs, scene progress map
- Load resumes from the exact sequence step via fast-forward
- Scene progress is restored on load, preserving backward navigation state

### Ending System
- 5 branching questions at the grave, each with 3 options
- Each option tagged: connect, leave, or reflect
- The category chosen most determines which ending plays
- Default (tie): connect

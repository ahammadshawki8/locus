# Locus: demo video script

**Length:** 2:56 (hard limit 3:00). **Voice-over:** about 395 words, calm and warm, roughly 145 words a minute.
**Story:** from a lesson idea to a print in hand. **Category:** Path B (Bring Your Own), Hands-off.
**Cast:** Nourin as the teacher. One narrator for the voice-over.

## The one device that carries the video: the stage tracker

From 0:42 to 2:12, a thin bar runs along the top of the frame with the nine GitLab DevSecOps stages:

```
PLAN · CREATE · VERIFY · SECURE · PACKAGE · RELEASE · CONFIGURE · MONITOR · GOVERN
```

Each stage lights up in GitLab orange at the moment the story reaches it, and stays lit. A small Google Cloud tag
lights beside CONFIGURE when the deploy starts. By 2:12 all nine are lit, so a judge sees every stage covered without
being told twice. The bar fades out as the story moves from software to the physical prints.

## Script

### 1. Cold open: the hook (0:00 to 0:20)

| Time | Picture | Voice-over | On screen |
|---|---|---|---|
| 0:00 | Black. Slow fade up on a fingertip resting on the raised curve of print B, extreme close-up, shallow focus. Silence, then one soft piano note. | (silence) | |
| 0:04 | The fingertip moves slowly along the curve and stops on a braille label. | "A teacher draws a curve on the board. Every sighted student sees its shape in a second." | |
| 0:10 | Cut to black. White numbers type on, one line at a time. | "A blind student hears a description... and has to imagine the rest." | **80 of 461** figures in one textbook could be touched. *Ladner et al., 2005* |
| 0:15 | Numbers change. | "Because each one has to be made by hand, by a specialist, and it takes hours." | **1 to 5 hours** to make one tactile graphic by hand. |

**Transition:** the numbers fade, a single raised dot appears in the centre, and the Locus mark (five raised dots along an arch) draws itself from it.

### 2. The promise (0:20 to 0:32)

| Time | Picture | Voice-over | On screen |
|---|---|---|---|
| 0:20 | Locus logo, then the live graph library carousel turning (`media/landing.gif` footage). | "This is Locus. A teacher asks in plain words. GitLab agents build the graph, check it by touch, and send back a plate to print." | **Locus** |
| 0:28 | A plate rendered in 3D, slowly rotating. Split card: left "Before", right "After". | "Built on JSCAD, and brought into GitLab, with a hands-off lifecycle around it." | **Before:** JSCAD, a modelling library · **After:** a hands-off service on GitLab and Google Cloud |

**Transition:** the rotating plate shrinks into the corner of a laptop screen. Pull back to reveal Nourin at her desk.

### 3. The request: one email (0:32 to 0:46)

| Time | Picture | Voice-over | On screen |
|---|---|---|---|
| 0:32 | Nourin at a laptop, evening light. She opens the Locus Request page and presses the microphone. | "Meet Nourin. Tomorrow, she is teaching quadratics." | |
| 0:36 | She speaks; the words appear on screen and become written maths: "y = 0.5x^2 - 2x + 5". | "She describes it in plain words, and Locus writes the email for her." | |
| 0:42 | The page drafts the email; she presses send. The stage tracker appears; **PLAN** lights. A hands-off clock starts in the bottom-right corner at 00:00. | "One email. From here, nobody touches it." | **PLAN** lights · clock **00:00** |

**Transition:** the sent email flies off screen and lands as a new GitLab issue.

### 4. GitLab takes over (0:46 to 1:40)

| Time | Picture | Voice-over | On screen |
|---|---|---|---|
| 0:46 | The GitLab issue appears, created from her email, labelled and assigned to the `locus-request` flow. A lower third: "Real run · issue #6 · 22 Oct 2026". | "GitLab turns her email into an issue, and a GitLab Duo agent picks it up." | |
| 0:52 | The intake agent's session: it writes `spec.json`, locks the maths in `request.lock.json`, and opens a merge request. **CREATE** lights. | "The intake agent locks her maths, exactly as asked, and opens a merge request." | **CREATE** lights |
| 1:00 | The pipeline graph fills with jobs. Zoom on `touchcheck`. **VERIFY** lights. | "The pipeline measures the plate the way a fingertip would." | **VERIFY** lights |
| 1:08 | The touch overlay: a red mark where a label sits too close to a line, with the measured value. | "It finds a grid line running into the curve. Zero millimetres apart: a fingertip would feel one line." | "TL-1: 0 mm apart, needs 3.2 mm" (use the real value from the run) |
| 1:14 | The fixer agent's commit to `layout.json` appears; the overlay turns green. | "So the fixer agent hides the grid, one of the fixes this rule allows. One correction, and every rule passes. If a graph can never be read, it refuses, and explains why." | |
| 1:22 | Guards and scans pass in a row of green ticks: `guard-maths`, `guard-scope`, `guard-description`, SAST, Secret Detection. **SECURE** lights. | "Guards prove the maths never changed, and the agent stayed in its own files. Security scans run too." | **SECURE** lights |
| 1:30 | The bundle job, then the package in the Package Registry. **PACKAGE** lights. Then the merge request merges itself and the release tag appears. **RELEASE** lights. | "Every file is hashed and packaged. The merge request merges itself, and the graph is released." | **PACKAGE**, **RELEASE** light |

**Transition:** the release tag pulses, and the camera follows a line out of GitLab into the Google Cloud console.

### 5. Google Cloud (1:40 to 1:58)

| Time | Picture | Voice-over | On screen |
|---|---|---|---|
| 1:40 | The deploy job log: OIDC token, Workload Identity Federation, Cloud Build. **CONFIGURE** and the Google Cloud tag light. | "GitLab signs in to Google Cloud with no stored keys at all." | **CONFIGURE** + Google Cloud |
| 1:46 | Cloud Run revisions: a new revision on the staging tag, then traffic moving to production. | "Cloud Run deploys to staging, checks it, then promotes it to production." | |
| 1:53 | The live site: Nourin's new graph turning in 3D. A cursor presses TL-1 to TL-5 (`media/graph.gif` footage). | "Her graph is live, with every touch check open to see." | |

**Transition:** the site fades into a monitoring view.

### 6. Watching over every graph (1:58 to 2:12)

| Time | Picture | Voice-over | On screen |
|---|---|---|---|
| 1:58 | `post-deploy-smoke` and `library-recheck` passing. **MONITOR** lights. | "Every deploy is checked, and every graph ever shipped is re-checked." | **MONITOR** lights |
| 2:04 | MR !9: the impact reviewer agent's note explaining which graphs a code change would affect. Then CODEOWNERS and the agents' service accounts. **GOVERN** lights. All nine stages are now lit. | "If a code change would alter a student's print, an agent explains why. No agent can approve its own work." | **GOVERN** lights. All nine lit. |

**Transition:** the full stage bar glows for one beat, then fades. Cut to Nourin's inbox.

### 7. The reply (2:12 to 2:22)

| Time | Picture | Voice-over | On screen |
|---|---|---|---|
| 2:12 | Nourin's inbox: the reply with the print files and the graph link. Then the print order email with the STL attached. | "Back in her inbox: the print files, and an order already sent to the print shop." | |
| 2:18 | Nourin smiles and closes the laptop. The hands-off clock stops and grows to fill the frame. | "No person in between." | **15 minutes** from email to reply (issue #6: 18:33:49 to 18:48:48 UTC) |

**Transition:** the laptop closes; match cut to a hand lifting a real white plate into the light.

### 8. A print in hand (2:22 to 2:42)

| Time | Picture | Voice-over | On screen |
|---|---|---|---|
| 2:22 | Hands holding real Locus plates, dark backdrop, slow push in. The prints collage photos work as stills here. | "This is what it all comes down to. Real plates, printed from the same code." | |
| 2:28 | Print A next to print B. A fingertip on A where curve and grid merge, then on B where the curve stands clear. | "The rules reject a plate where lines merge into one ridge... and pass the plate a fingertip can follow." | Print A: rejected · Print B: passes |
| 2:35 | Close-up of the braille ID in the corner of a plate, then the matching graph page. | "A braille ID on every plate traces it back to its request." | |

**Transition:** pull back from the plate to black; the Locus mark returns.

### 9. Why Locus (2:42 to 2:56)

| Time | Picture | Voice-over | On screen |
|---|---|---|---|
| 2:42 | Three short cards in quick succession, then the category tag. | "Agents that fix their own work against measured touch rules. All nine DevSecOps stages. And a real object a student can hold." | **Self-correcting agents** · **9 of 9** DevSecOps stages · **Built on Google Cloud** · *Path B · Hands-off* |
| 2:50 | Back to the opening shot: the fingertip on the raised curve, now moving with confidence. | "Locus. So every student can feel the shape of the maths." | **Locus** · gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43384339/showcase |
| 2:56 | Cut to black. | (end) | |

## Make it easy to judge from the video alone

Judges will mostly watch, not run. Every claim should be visible on screen as proof, not just said.

1. **Real-run label.** Lower third on the first GitLab shot: "Real run · issue #6 · 22 Oct 2026". Keep the issue number
   readable whenever GitLab is on screen.
2. **Hands-off clock.** A small timer in the bottom-right corner from the moment Nourin presses send (0:42) to the
   reply (2:18), showing real elapsed time while the footage is sped up. It proves nobody stepped in.
3. **Show the agents' names.** When the intake and fixer agents commit, zoom on the commit author so the service
   account name is readable. Judges then see that the agents, not a person, made the changes.
4. **Zoom and highlight every screen recording.** Recorded at 1080p, GitLab text is small. Zoom to the job, the line
   or the value being talked about, and draw a soft highlight box around it. Never show a full GitLab page unzoomed
   for more than a second.
5. **One idea per shot.** Each shot shows the one thing the voice-over names at that moment, so the eye and the ear
   agree.
6. **Captions on, always.** Many judges watch muted at first. Burned-in captions match the voice-over word for word.
7. **Links on the last frame.** The GitLab project URL and the live site URL stay on screen for the final 3 seconds.

## Production notes (keep the video true)

1. **Record Nourin's run for real, in one take.** Nourin sends the email herself, and nobody touches the issue, the
   merge request or the pipeline until the reply arrives. Screen-record the whole run with a clock visible.
2. **Speed up waiting, never reorder events.** Use fast-forward with a small "real time, sped up" mark in the corner
   whenever time is skipped.
3. **Fill in the real facts after the run:** the rule that failed and its measured value (1:08), and the minutes from
   email to reply (2:18). If the run passes first time, replace 1:08 to 1:22 with: "Every touch rule passes on the
   first try. When one fails, the fixer agent corrects the layout itself." Then show the fixer's real commit from
   MR !14, labelled "from issue #4".
4. **The plates in hand are our prototype plates,** printed from the same code. The voice-over says "printed from the
   same code", never that they are Nourin's graph.
5. **Say "a fingertip can follow", never "a blind student read it".** The team tested the plates by touch.
6. **Hide every email address** in every frame: Nourin's, the Service Desk "Email a new issue" address and the print
   shop's. Check the issue page, the inbox and the print order.
7. **Music:** royalty-free or self-made only (the rules forbid copyrighted music). Soft piano for the hook, a gentle
   pulse under the GitLab section, piano again for the prints.
8. **Captions:** burn in captions that match the voice-over word for word. No emojis, no long dashes.
9. **Export:** 1080p, under 3:00, uploaded to YouTube as public.

## Shot list (record in this order)

1. Nourin's full run, screen-recorded end to end: Request page with voice typing, email, GitLab issue, agent
   session, merge request, pipelines, guards, package, release, deploy job log, Cloud Run console, live site, inbox.
2. Cloud Run revisions page and traffic split, recorded during the deploy.
3. MR !9 (impact reviewer), CODEOWNERS file, the service accounts list.
4. Close-ups of the real plates: fingertip on print B's curve (opening and ending), print A vs print B, braille ID.
   Dark backdrop, soft side light, slow camera moves.
5. Nourin at her desk: speaking the request, pressing send, smiling at the reply, closing the laptop.
6. Voice-over last, recorded against the edit.

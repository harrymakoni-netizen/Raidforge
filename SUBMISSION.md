# RAIDFORGE — submission draft

## Elevator pitch

Chat invents the attacks. Codex turns them into a playable boss. Twitch raids carry that community-created monster to its next challenger.

## What it does

RAIDFORGE gives streamers a recurring live segment: propose, vote, forge, fight, and pass it on. Viewers submit attack ideas through Twitch chat. The streamer selects an idea; Codex generates a bounded attack program, the engine checks its instruction and projectile budgets, and the streamer previews and approves it. A short arcade fight turns the community's idea into a shared moment.

When a streamer arms a handoff and raids another participating channel, the receiving streamer can accept the boss with its creator credit and accumulated raid history. The next community inherits the story and can add its own mutation.

## How Codex was used

This project was built in a Codex session, including the original Canvas goose artwork, game loop, responsive workshop UI, Twitch integration, server, validation, and tests. Runtime generation also uses the Codex SDK to create structured attack programs from selected viewer proposals. Runtime generations remain pending until the streamer approves them.

Primary build session ID: **retrieve with `/status` in the build session**.

## Honest scope

- Working practice mode: three example mutations, arena combat, approval/rollback, browser persistence, boss export/import, and clearly labeled rehearsal handoffs.
- Implemented live path: Twitch OAuth/EventSub, chat proposal/vote handling, Codex SDK generator, approval API, OBS spectator relay, raid invitation and acceptance.
- Requires connected Twitch channels and authenticated Codex on the Node service. Do not describe local rehearsals or mocked tests as live footage.
- Current generated mechanics are bounded attack programs, not unrestricted game generation.

## Suggested demo (2:45)

- 0:00–0:15 — Open on the actual fight, show the stream and chat. “Chat built this boss. Now I have to survive it.”
- 0:15–0:45 — A real viewer types `!forge`; another votes. Select it in the workshop.
- 0:45–1:10 — Show Codex producing the program. If generation is time-compressed, explicitly label elapsed time. Preview and equip the resulting attack.
- 1:10–1:45 — Play a short fight and show creator credit plus the proposed behavior working.
- 1:45–2:15 — Arm a handoff; perform a real raid between two connected channels. Show the receiving streamer accepting the same boss and its history.
- 2:15–2:35 — Briefly show the Codex build session, attack validation, and tests.
- 2:35–2:45 — Close: “Your community’s imagination becomes another streamer’s boss fight.”

## Before submitting

1. Run the real Twitch and Codex flow with two accounts and fix any integration issues found.
2. Record actual Twitch footage, including a real raid and real generation.
3. Provide the repository URL with runnable source, assets, and setup instructions. The private Sites source repository is not a substitute for the competition's GitHub/GitLab/Bitbucket requirement; mirror it to an eligible repository.
4. Add the primary build session ID and an English project description.
5. Upload the video publicly to YouTube and link it in Devpost.
6. Submit by November 2, 2026, 2:00 PM Pacific, per the competition rules.

Competition: https://twitchcon-codex.devpost.com/
Rules: https://twitchcon-codex.devpost.com/rules

# BirdQuest

Pokémon GO for birdwatching — contribute to the largest biodiversity dataset + earn real crypto rewards!


## The Problem

I've been birdwatching for over a decade. These are some of its shortcomings:

1. **No social layer**: birdwatching is solitary, no one shares trips like Strava/Flighty
2. **No incentives**: nothing pushing me to stay consistent like Duolingo streaks or GitHub commits
3. **Boring tools**: existing apps focus on data entry > fun experiences, no reason to log observations

Most casual birders never log their sightings because there's no reward or motivation to do so.

*How do we incentivize more people to contribute to birding data?*


## Core Features

1. Social
    - **Share Cards** — share your birding trip stats, just like Strava/Flighty
    - **Community map** — see where other birders have been and tap any trip to view their sightings

2. Incentives + Gamification
    - **Onchain rewards** — earn BIRD tokens every trip, weighted by distance, time, and species rarity
    - **Weekly quests** — compete on a live leaderboard for a HBAR prize pool, paid out automatically onchain
    - **NFT badges** — mint badges like *First Trip* and *Rare Bird* directly to your wallet
    - **Tip users** — tip other birders for great finds!

3. Direct Contribution to iNaturalist
    - **AI bird identification** — point your camera at a bird, get an instant ID powered by Claude vision
    - **iNaturalist sync** — publish sightings to the largest citizen science database in one tap
        - [iNaturalist Observations](https://www.inaturalist.org/observations?place_id=any&user_id=birdquest&verifiable=any)

Unlike other apps that force you to start from scratch, BirdQuest lets you contribute directly to the world's largest biodiversity dataset with over 4 million contributors.


## Tech Stack

**Mobile:** React Native via Expo  
**Backend:** Next.js API routes deployed on Vercel  
**Database:** Supabase (complex retrieval of trip history, leaderboards, quest management)  
**AI:** Claude API for bird identification  
**iNaturalist API:** directly publishing observations to iNaturalist

BirdQuest uses both Hedera and Dynamic comprehensively:

### Hedera

1. **HCS (Hedera Consensus Service)** — every trip is submitted as an immutable, timestamped message to a public topic. This creates a tamper-proof audit trail of all birdwatching activity independent of our database.
2. **HTS fungible tokens (BIRD)** — a custom token minted to users at the end of each trip. Scoring factors in distance, time, and species rarity. The operator treasury mints and transfers tokens server-side with sub-cent fees.
3. **HTS NFTs (BQBADGE)** — achievement badges minted as non-fungible tokens and transferred to users' wallets. Each badge carries on-chain metadata (name, image) verified via the Mirror Node API to prevent duplicates.
4. **Scheduled Transactions** — weekly quest payouts use `ScheduleCreateTransaction` with `waitForExpiry` to create a publicly auditable, time-locked HBAR distribution to the top 3 finishers. The schedule ID is stored and linked to Hashscan so anyone can verify the payout.
5. **Mirror Node API** — used for fetching user’s NFT badges + BIRD token balance.

*The operator account handles all token transfers server-side, so users never pay gas.* 

### Dynamic

- Embedded wallet creation via username + email
    - Username useful for social aspect
- Custom chain: Hedera Testnet (EVM)
- Various hooks
    - state, address, wallet/login modal
- Transactions
    - Tipping and receiving tokens

## Why Now

Two cultural shifts are converging:

1. **The IRL renaissance**: as AI takes over more of our digital lives, people are actively seeking out real-world experiences. Birdwatching is the anti-doomscroll: you're outside, present, and contributing to something tangible. That shift is accelerating.

2. **The Pokémon GO effect**: Pokémon GO proved that millions of people will go outside and walk for hours if there's a game layer on top. Birding is having its own moment: participation has surged post-pandemic, apps like Merlin have crossed 10M downloads, and news coverage of birding as a hobby has continued to increase. The audience is already there — it just needs a reason to log their sightings.


## Future Plans

- **Notifications**: push notifications when a rare species is spotted near you or when new user joins
- **World ID**: prevent Sybil attacks and users gaming the system
- **Guilds**: team-based weekly quests with shared prize pools across cities
- **Trail Record**: save final trail record, simialar to Strava
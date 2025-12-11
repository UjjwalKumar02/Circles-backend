# Circles-backend

#### 1. Auth

- utils/config : passport.js
- authRoutes : "/auth/google", "/auth/callback/google"
- authControllers : handleGoogleLogin

#### 2. Prisma

- changed the output of generator
- changed ts.config to include prisma.config
- update dev script: "node dist/src/index.js"

```
npm install -D prisma
npx prisma init --datasource-provider postgresql --output ../generated/prisma
npm install @prisma/client @prisma/adapter-pg
npx prisma generate
npx prisma migrate dev --name init
npx prisma generate   // after migration
```

#### 3. Routes

- wrote route skeletons
- wrote main logic
- add other routes if needed

#### Future additions:

- add images (cloudinary)
- how are we getting token in frontend (is it happening automatically)
- public profile viewing: some highlighted posts
- allow only preview of commmunity for non-members
- exploring communities
- elo count: likeCounts of all posts => converted into points thru some logic
- elo leaderboard
- contextapi or recoil
- notifications for replies (at end)
- anonymous and announcement in post creation
- zod
- ws
- likeCounts and commentCounts


#### Need to read

- sessions
- passport js
- rootDir error
- prisma new connectivity (pg)
- sameSite, path, maxAge of cookie

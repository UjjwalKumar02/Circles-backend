import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma.js";


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const googleId = profile.id;
        const avatar = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error("No email from Google"), null);
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              googleId,
              name: profile.displayName,
              avatar,
            },
          });
        } else if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId, avatar },
          });
        }

        done(null, user)
      } catch (error) {
        done(error, null)
      }
    }
  )
);

export default passport;
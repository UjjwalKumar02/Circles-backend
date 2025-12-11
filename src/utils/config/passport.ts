import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../../lib/prisma.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accesstoken, refreshtoken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const username = profile.displayName;
        const avatar = profile.photos?.[0]?.value;

        if (!email || !username)
          return done(
            new Error("Error in google signin, data provided is empty!")
          );

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              googleId,
              email,
              username,
              avatar: avatar || null,
            },
          });
        } else {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              avatar: avatar || null,
            },
          });
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

export default passport;

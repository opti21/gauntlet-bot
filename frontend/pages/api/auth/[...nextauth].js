import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'

export default NextAuth({
    // Configure one or more authentication providers
    providers: [
        Providers.Twitch({
            clientId: process.env.TWITCH_CLIENT,
            clientSecret: process.env.TWITCH_SECRET
        }),
    ],

    // A database is optional, but required to persist accounts in a database
    database: `mongodb+srv://gauntlet:${process.env.MONGO_PASS}@cluster0.9bvpn.mongodb.net/gauntlet?retryWrites=true&w=majority`,

})
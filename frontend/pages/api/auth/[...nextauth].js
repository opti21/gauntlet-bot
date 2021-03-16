import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'

export default NextAuth({
    // Configure one or more authentication providers
    callbacks: {
        async redirect(url, baseUrl) {
            return baseUrl + '/current'
        },
    },
    providers: [
        Providers.Twitch({
            clientId: process.env.TWITCH_CLIENT,
            clientSecret: process.env.TWITCH_SECRET
        }),
    ],

    // A database is optional, but required to persist accounts in a database
    database: process.env.MONGODB_URI,

})
import prisma from "./prisma";

export default async function checkUser(user) {
  const userExists = await prisma.users
    .findFirst({
      where: {
        id: user.sub.split("|")[2],
      },
    })
    .catch((e) => {
      console.error(e);
    });

  if (userExists) {
    return userExists;
  } else {
    const createUser = await prisma.users
      .create({
        data: {
          id: user.sub.split("|")[2],
          username: user.nickname,
          user_pic: user.picture,
        },
      })
      .catch((e) => {
        console.error(e);
      });
    return createUser;
  }
}

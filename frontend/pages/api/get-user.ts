import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../util/prisma';

export default (req:NextApiRequest, res:NextApiResponse) => {
    prisma.users
    res.status(200).json({success: true})

}
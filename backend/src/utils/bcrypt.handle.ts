import { hash, compare } from 'bcryptjs';

const encrypt = async (contraPlana: string) => {
    const passwordHash = await hash(contraPlana, 8);
    return passwordHash;
}

const verified = async (pass: string, passHash: string) => {
    const isCorrect = await compare(pass, passHash);
    return isCorrect;
}

export { encrypt, verified };
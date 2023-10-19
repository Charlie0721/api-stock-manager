import { Request, Response } from 'express'
import { connect } from '../database'
import { SigninInterface, LoginInterface } from '../interface/users.interface'
import * as bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2/promise';
export class UsersController {

    static saveUser = async (req: Request, res: Response): Promise<Response | any> => {

        try {
            const conn = await connect();
            const user: SigninInterface = req.body;
            const { uuid, email, password, userType } = user
            const hashedPassword = await this.hashPassword(password);
            const [userFound] = await conn.query<RowDataPacket[]>(`
            SELECT * FROM users_stock_manager WHERE email = ?
            `, [user.email])
            if (userFound.length > 0) {
                return {
                    message: 'User already exists',
                    status: 302
                }
            }
            const responseUser = await conn.query(`
            INSERT INTO users_stock_manager (uuid,email,password,userType)
            VALUES(?,?,?,?)
            `, [uuid, email, hashedPassword, userType])

            return res.status(201).json({
                responseUser,
                uuid,
                email
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error })
        }
    }
    static hashPassword = async (password: string): Promise<string> => {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    static loginUSer = async (req: Request, res: Response): Promise<Response> => {
        const user: LoginInterface = req.body;
        const { email, password } = user;

        try {
            const conn = await connect();
            const [userFound] = await conn.query<RowDataPacket[]>(`
                SELECT * FROM users_stock_manager WHERE email=?            
              `, [email])
            if (userFound.length === 0) {
                return res.status(404).json({
                    message: 'no se encontro usuario'
                })
            }
            const users = userFound[0];
            const isPasswordValid = await this.comparePasswords(password, users.password);
            if (!isPasswordValid) {
                return res.status(404).json({
                    message: 'contraseña no valida !'
                });
            }
            return res.json({
                uuid: users.uuid,
                email: users.email,
                userType: users.userType
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error })
        }
    }
    static comparePasswords = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

}
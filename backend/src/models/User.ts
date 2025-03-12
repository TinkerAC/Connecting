// backend/src/models/User.ts
import {DataTypes, Model} from 'sequelize';
import sequelize from './db';

export class User extends Model {
    public id!: number;
    public username!: string;
    public password!: string;
    public role!: 'admin' | 'teacher' | 'student';
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('admin', 'teacher', 'student'),
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'User'
    }
);
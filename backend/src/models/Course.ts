// backend/src/models/Course.ts
import {DataTypes, Model} from 'sequelize';
import sequelize from './db';

export class Course extends Model {
    public id!: number;
    public title!: string;
    public description!: string;
    public teacherId!: number; // 指向教授该课程的教师ID
}

Course.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        teacherId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'Course'
    }
);
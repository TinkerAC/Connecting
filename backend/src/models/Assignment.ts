// backend/src/models/Assignment.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from './db';

export class Assignment extends Model {
    public id!: number;
    public title!: string;
    public description!: string;
    public courseId!: number; // 新增 courseId 字段
}

Assignment.init(
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
            allowNull: false
        },
        courseId: {  // 新增字段定义
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    },
    {
        sequelize,
        modelName: 'Assignment'
    }
);
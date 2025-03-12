// backend/src/models/Submission.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from './db';

export class Submission extends Model {
    public id!: number;
    public assignmentId!: number;
    public studentId!: number;
    public filePath!: string;
    public submittedAt!: Date;
}

Submission.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        assignmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        filePath: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        submittedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'Submission',
    }
);

export default Submission;
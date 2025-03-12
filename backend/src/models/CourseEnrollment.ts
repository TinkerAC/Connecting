// backend/src/models/CourseEnrollment.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from './db';

export class CourseEnrollment extends Model {
    public studentId!: number;
    public courseId!: number;
}

CourseEnrollment.init(
    {
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        courseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        }
    },
    {
        sequelize,
        modelName: 'CourseEnrollment',
        timestamps: false  // 根据需求设置是否记录时间戳
    }
);
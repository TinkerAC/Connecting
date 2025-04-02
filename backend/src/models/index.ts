// backend/src/models/index.ts
import sequelize from './db';
import {User} from './User';
import {Assignment} from './Assignment';
import {Course} from './Course';
import {CourseEnrollment} from './CourseEnrollment';
import Submission from "./Submission";

// 1. 课程与作业关联：一个课程可以有多个作业
Course.hasMany(Assignment, {foreignKey: 'courseId', as: 'assignments'});
Assignment.belongsTo(Course, {foreignKey: 'courseId', as: 'course'});

// 2. 教师与课程关联：一个教师可以教授多个课程
User.hasMany(Course, {foreignKey: 'teacherId', as: 'taughtCourses'});
Course.belongsTo(User, {foreignKey: 'teacherId', as: 'teacher'});

// 3. 学生与课程多对多关联（通过 CourseEnrollment 作为中间表）
User.belongsToMany(Course, {
    through: CourseEnrollment,
    as: 'enrolledCourses',
    foreignKey: 'studentId'
});
Course.belongsToMany(User, {
    through: CourseEnrollment,
    as: 'students',
    foreignKey: 'courseId'
});

// 4. 为 CourseEnrollment 明确定义关联关系
CourseEnrollment.belongsTo(Course, {foreignKey: 'courseId', as: 'course'});
CourseEnrollment.belongsTo(User, {foreignKey: 'studentId', as: 'student'});

//5.学生和提交的作业关联
User.hasMany(Submission, {foreignKey: 'studentId', as: 'submissions'});
Submission.belongsTo(User, {foreignKey: 'studentId', as: 'student'});

export {sequelize, User, Assignment, Course, CourseEnrollment};
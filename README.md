# NYC-Transit-Hub

Project Name: NYC Transit Hub
Objective: Develop a web application to offer real-time updates, schedules, and transit information for New York City's public transportation system.

API: https://api.mta.info

Suggested Key Features:

Interactive Map: Display a real-time map of subway and bus routes, allowing users to visualize transit options
Favorites and Alerts: Allow users to save favorite routes/stations and set up notifications for service changes or delays
Accessibility Information: Include details about elevator and escalator availability at stations for accessibility.
Service Status Dashboard: Show an overview of the status of all MTA services in a single dashboard.
Multilingual Support: Offer the application in multiple languages.
User Accounts: Basic account creation and user authentication using Firebase.
Suggested Timeline:

Week 1: Setup
Task 0: Team formation (4-6 students)
Task 1: Explore MTA API
Week 2: Initial Development
Task 2: Set Up Development Environment
Task 3: Design Database Schema and Set Up Backend Framework
Week 3: Backend Development
Task 4: Implement Live Transit Updates Backend
Week 4: Mid-Checkpoint Presentation
Present backend development progress, including real-time data handling and route planning functionality.
Week 5-6: Frontend Development and Integration
Task 5: Develop Frontend Structure and Implement status dashboard
Task 6: Integrate Firebase and Implement transit options
Week 7: Finalizing Features and Testing
Task 7: Implement multilingual language support 
Task 8: Testing and Debugging
Week 8: Deployment and Final Presentation Preparation
Task 9: Deployment
Task 10: Final Testing and Presentation Preparation 
Week 9: Final Presentation

woxianz分工
Shiheng Fan: 		A：交通数据与后端 
Chris Xia: 		B：地图与站点查询
Yu-Chen Chung	C：服务状态与无障碍信息
Minghao Zhang: 	D：账号与个性化 

成员
负责模块
主要职责
A：交通数据与后端基础
站点、线路、实时到站
搭建 Spring Boot 后端；处理 MTA 数据；提供站点和到站接口；缓存与错误处理；后端部署
B：地图与交通查询
网站布局、地图、搜索
搭建 React 前端；地图与站点展示；线路筛选；到站信息页面；手机适配；前端部署
C：服务状态与无障碍信息
服务公告、设施状态
获取并处理公告和电梯／扶梯数据；提供对应接口；开发状态看板和详情页面
D：账户与个性化
登录、收藏、提醒、多语言
Firebase 认证；用户数据存储；收藏与偏好接口及页面；个性化站内提醒；语言切换机制


时间表
Week 1：Setup — 组队、探索 MTA API
成员	本周任务
A	探索站点、线路和实时到站数据；跑通一个真实数据获取及解析示例
B	设计主要页面草图和用户查询流程；研究地图工具，显示示例站点
C	探索服务公告和无障碍设施数据；获取样例，整理字段
D	探索 Firebase Authentication；验证基本登录；整理收藏、偏好和提醒的数据需求

Week 2：Initial Development — 开发环境、数据库和后端框架
成员	本周任务
A	搭建 Spring Boot 后端；建立站点和线路的数据结构；确定公共接口及错误返回格式
B	搭建 React + TypeScript 前端；完成导航和基本布局；使用模拟数据开发搜索及站点页面
C	建立公告、设施状态的数据结构和后端模块；与 A 统一站点、线路 ID
D	牵头设计用户、收藏、偏好及通知记录的数据表；配置 PostgreSQL 和 Firebase；确定认证方式
技术栈
部分
技术
用途
前端语言
TypeScript
编写页面和交互逻辑
前端框架
React + Vite
搭建网页项目
页面样式
Tailwind CSS
页面布局、手机适配
地图
Leaflet + React Leaflet
展示站点、线路和地图交互
后端语言
Java
编写业务逻辑
后端框架
Spring Boot
提供 API，处理 MTA 数据和用户请求
数据库
PostgreSQL
保存收藏、偏好和通知记录
数据库访问
Spring Data JPA
在 Java 中操作数据库
身份认证
Firebase Authentication
注册、登录；后端使用 Firebase Admin SDK 验证身份
协作
GitHub
代码管理、分支和 Pull Request








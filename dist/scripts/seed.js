"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const profile_1 = require("../routes/profile");
const about_1 = require("../routes/about");
const settings_1 = require("../routes/settings");
const initialProjects = [
    {
        id: "1",
        title: "HireLoop",
        category: "Full Stack Job Portal Platform",
        description: "A modern job portal platform that connects job seekers with recruiters. Users can explore job opportunities, apply for jobs, manage applications, and access premium features through a responsive interface.",
        detailedDescription: "HireLoop is a full-stack job portal web application built with Next.js, Express.js, and MongoDB. It provides separate experiences for job seekers, recruiters, and administrators. Job seekers can browse jobs, submit applications, and track their application status, while recruiters can manage job postings and applications. Better Auth handles authentication, and Stripe integration supports premium subscriptions.",
        technologies: [
            "Next.js",
            "TypeScript",
            "Tailwind CSS",
            "Express.js",
            "MongoDB",
            "Better Auth",
            "Stripe",
            "REST API",
        ],
        image: "/images/hireloopBanner.png",
        githubUrl: "https://github.com/fuadalmaimun/hireloop-client.git",
        backendGithubUrl: "https://github.com/fuadalmaimun/hireloop-server.git",
        liveUrl: "https://hireloop-client-green-zeta.vercel.app",
        role: "Full Stack Developer",
        status: "Live Project",
        features: [
            "Role-based authentication for job seekers, recruiters, and admins",
            "Browse and explore available job opportunities",
            "View detailed job information",
            "Apply for jobs as a job seeker",
            "Track and manage submitted applications",
            "Recruiters can create and manage job postings",
            "Recruiters can manage job applications",
            "Search and filter job listings",
            "Application status management",
            "Premium subscription integration using Stripe",
            "Protected routes and role-based access control",
            "Responsive interface for desktop and mobile devices",
        ],
        challenges: [
            {
                title: "Authentication and Authorization",
                detail: "Implementing Better Auth for user authentication and role-based access control to protect private routes and manage different user permissions.",
            },
            {
                title: "Job Application Management",
                detail: "Building an application management system where job seekers can apply for jobs and track their application status.",
            },
            {
                title: "Role-Based Dashboard",
                detail: "Creating separate dashboard experiences for job seekers, recruiters, and administrators based on their roles.",
            },
        ],
        stateManagement: {
            summary: "Next.js manages frontend routing and interactive user interfaces, while server-side functions communicate with the Express.js backend. MongoDB stores user, job, application, and payment information.",
            highlights: [
                {
                    title: "Dynamic job data",
                    detail: "Job listings and detailed job information are retrieved from backend API.",
                },
                {
                    title: "Application management",
                    detail: "Users can submit applications and manage history through dedicated dashboard.",
                },
            ],
        },
        backendArchitecture: {
            summary: "A standalone Express.js REST API connected to MongoDB, handling authentication-related operations, job management, applications, and Stripe payment processing.",
        },
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
const initialSkills = [
    { id: "1", name: "React.js", category: "frontend", proficiency: "advanced", icon: "React", description: "Building interactive UIs with React", order: 1 },
    { id: "2", name: "TypeScript", category: "frontend", proficiency: "advanced", icon: "Code", description: "Type-safe JavaScript development", order: 2 },
    { id: "3", name: "Tailwind CSS", category: "frontend", proficiency: "advanced", icon: "Palette", description: "Utility-first CSS framework", order: 3 },
    { id: "4", name: "JavaScript (ES6+)", category: "frontend", proficiency: "advanced", icon: "Code", description: "Modern JavaScript programming", order: 4 },
    { id: "5", name: "HTML5", category: "frontend", proficiency: "expert", icon: "FileCode", description: "Semantic HTML markup", order: 5 },
    { id: "6", name: "CSS3", category: "frontend", proficiency: "advanced", icon: "Palette", description: "Advanced CSS styling and animations", order: 6 },
    { id: "7", name: "Node.js", category: "backend", proficiency: "intermediate", icon: "Server", description: "JavaScript runtime for backend", order: 7 },
    { id: "8", name: "Express.js", category: "backend", proficiency: "intermediate", icon: "Server", description: "Web framework for Node.js", order: 8 },
    { id: "9", name: "REST API", category: "backend", proficiency: "advanced", icon: "Network", description: "Building RESTful APIs", order: 9 },
    { id: "10", name: "MongoDB", category: "database", proficiency: "intermediate", icon: "Database", description: "NoSQL database", order: 10 },
    { id: "11", name: "Git & GitHub", category: "tools", proficiency: "advanced", icon: "GitBranch", description: "Version control and collaboration", order: 11 },
    { id: "12", name: "VS Code", category: "tools", proficiency: "advanced", icon: "Code", description: "Code editor and development environment", order: 12 },
];
const initialExperiences = [
    {
        id: "1",
        title: "Learning React & TypeScript",
        description: "Deep diving into modern React with TypeScript",
        date: "2024 - Present",
        type: "learning",
        icon: "BookOpen",
        details: [
            "Advanced React patterns and hooks",
            "TypeScript type system mastery",
            "State management solutions",
            "Performance optimization",
        ],
        tags: ["React", "TypeScript", "Advanced"],
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "2",
        title: "Frontend Development Bootcamp",
        description: "Comprehensive frontend development training",
        date: "2023 - 2024",
        type: "education",
        icon: "GraduationCap",
        details: [
            "HTML5, CSS3, JavaScript foundations",
            "React fundamentals and advanced concepts",
            "Responsive design principles",
            "Building real-world projects",
        ],
        tags: ["Frontend", "Web Development"],
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "3",
        title: "Full Stack Development Journey",
        description: "Expanding skills to include backend development",
        date: "2023 - Present",
        type: "learning",
        icon: "Code",
        details: [
            "Node.js and Express.js basics",
            "Database design and management",
            "API development",
            "Deployment and DevOps fundamentals",
        ],
        tags: ["Full Stack", "Backend", "Databases"],
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
const initialEducation = [
    {
        id: "1",
        degree: "Secondary School Certificate (SSC) / Dakhil",
        institution: "Gausia Rahmania Hosainia Alim Madrasah",
        period: "2025–2026",
        type: "Academic Education",
        icon: "GraduationCap",
        grade: "GPA 4.31",
        location: "Bangladesh",
        description: "Completed the SSC-equivalent Dakhil examination in the 2025–2026 academic period. Developed foundational knowledge, discipline, and an interest in technology and software development.",
        skills: [
            "Academic Fundamentals",
            "Logical Thinking",
            "Problem Solving",
            "Self-Learning",
        ],
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "2",
        degree: "Higher Secondary Certificate (HSC) / Alim",
        institution: "Currently Studying",
        period: "Running",
        type: "Academic Education",
        icon: "GraduationCap",
        grade: "In Progress",
        location: "Bangladesh",
        description: "Currently pursuing higher secondary education (HSC / Alim) while continuing to develop programming skills and practical experience in web development.",
        skills: [
            "Higher Secondary Studies",
            "Programming",
            "Web Development",
            "Continuous Learning",
        ],
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "3",
        degree: "Full Stack Web Development Bootcamp",
        institution: "Programming Hero",
        period: "2026",
        type: "Professional Training",
        icon: "Award",
        grade: "In Progress",
        location: "Online",
        description: "Learning web development through hands-on projects, covering frontend technologies, React, Next.js, and the fundamentals of backend development.",
        skills: [
            "HTML5 / CSS3 / JavaScript (ES6+) / TypeScript / Tailwind CSS",
            "React.js & Hooks",
            "Next.js",
            "Node.js, MongoDB & Express.js",
            "Git & GitHub",
        ],
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
const initialServices = [
    {
        id: "1",
        title: "Full Stack Web Development",
        description: "Building complete web applications from responsive frontends to scalable backend APIs and secure databases.",
        longDescription: "End-to-end full stack development using modern tech stacks including React, Next.js, Node.js, Express, and MongoDB. Ensuring high performance, clean architecture, and seamless user experiences.",
        icon: "Code",
        features: [
            "Full-stack architecture design",
            "RESTful API design and development",
            "Database schema modeling with MongoDB",
            "Secure authentication & authorization",
            "Responsive, mobile-friendly layouts",
        ],
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "2",
        title: "Frontend UI/UX Engineering",
        description: "Crafting pixel-perfect, highly responsive, and accessible user interfaces using React, Next.js, and Tailwind CSS.",
        longDescription: "Transforming designs into production-ready interactive web apps with smooth animations, optimal load times, and intuitive usability.",
        icon: "Layout",
        features: [
            "Component-based architecture",
            "Responsive design for all devices",
            "Tailwind CSS styling & custom design tokens",
            "Interactive animations and micro-interactions",
        ],
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "3",
        title: "Backend & API Integration",
        description: "Developing robust REST APIs, third-party service integrations, and database management solutions.",
        longDescription: "Building fast, reliable backend microservices and APIs with Express and Node.js, integrating external APIs, payment gateways, and authentication services.",
        icon: "Server",
        features: [
            "Express.js REST APIs",
            "Third-party API integration",
            "Image upload & cloud storage",
            "Role-based access control",
        ],
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
const initialTestimonials = [
    {
        id: "1",
        name: "Collaborator / Mentor",
        role: "Senior Developer",
        company: "Programming Hero",
        avatar: "/images/profile.png.jpeg",
        text: "Fuad shows exceptional dedication to learning, writing clean code, and quickly mastering complex web concepts.",
        rating: 5,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
async function seedDatabase() {
    try {
        console.log("[seed] Connecting to MongoDB...");
        const db = await (0, db_1.connectDB)();
        // 1. Profile
        const profileCol = db.collection("profile");
        const existingProfile = await profileCol.findOne({});
        if (!existingProfile) {
            await profileCol.insertOne(profile_1.defaultProfile);
            console.log("[seed] Profile seeded.");
        }
        else {
            console.log("[seed] Profile already exists, skipped.");
        }
        // 2. About
        const aboutCol = db.collection("about");
        const existingAbout = await aboutCol.findOne({});
        if (!existingAbout) {
            await aboutCol.insertOne(about_1.defaultAbout);
            console.log("[seed] About section seeded.");
        }
        else {
            console.log("[seed] About section already exists, skipped.");
        }
        // 3. Settings
        const settingsCol = db.collection("settings");
        const existingSettings = await settingsCol.findOne({});
        if (!existingSettings) {
            await settingsCol.insertOne(settings_1.defaultSettings);
            console.log("[seed] Settings seeded.");
        }
        else {
            console.log("[seed] Settings already exist, skipped.");
        }
        // 4. Projects
        const projectsCol = db.collection("projects");
        const projectsCount = await projectsCol.countDocuments();
        if (projectsCount === 0) {
            await projectsCol.insertMany(initialProjects);
            console.log(`[seed] Seeded ${initialProjects.length} projects.`);
        }
        else {
            console.log(`[seed] Projects already exist (${projectsCount}), skipped.`);
        }
        // 5. Skills
        const skillsCol = db.collection("skills");
        const skillsCount = await skillsCol.countDocuments();
        if (skillsCount === 0) {
            await skillsCol.insertMany(initialSkills);
            console.log(`[seed] Seeded ${initialSkills.length} skills.`);
        }
        else {
            console.log(`[seed] Skills already exist (${skillsCount}), skipped.`);
        }
        // 6. Experiences
        const expCol = db.collection("experiences");
        const expCount = await expCol.countDocuments();
        if (expCount === 0) {
            await expCol.insertMany(initialExperiences);
            console.log(`[seed] Seeded ${initialExperiences.length} experiences.`);
        }
        else {
            console.log(`[seed] Experiences already exist (${expCount}), skipped.`);
        }
        // 7. Education
        const eduCol = db.collection("education");
        const eduCount = await eduCol.countDocuments();
        if (eduCount === 0) {
            await eduCol.insertMany(initialEducation);
            console.log(`[seed] Seeded ${initialEducation.length} education items.`);
        }
        else {
            console.log(`[seed] Education already exists (${eduCount}), skipped.`);
        }
        // 8. Services
        const srvCol = db.collection("services");
        const srvCount = await srvCol.countDocuments();
        if (srvCount === 0) {
            await srvCol.insertMany(initialServices);
            console.log(`[seed] Seeded ${initialServices.length} services.`);
        }
        else {
            console.log(`[seed] Services already exist (${srvCount}), skipped.`);
        }
        // 9. Testimonials
        const testCol = db.collection("testimonials");
        const testCount = await testCol.countDocuments();
        if (testCount === 0) {
            await testCol.insertMany(initialTestimonials);
            console.log(`[seed] Seeded ${initialTestimonials.length} testimonials.`);
        }
        else {
            console.log(`[seed] Testimonials already exist (${testCount}), skipped.`);
        }
        console.log("[seed] Seeding completed successfully!");
    }
    catch (error) {
        console.error("[seed] Error during seeding:", error);
    }
    finally {
        await (0, db_1.closeDB)();
    }
}
seedDatabase();

# **App Name**: Chrysalis Ops Portal

## Core Features:

- Staff & Role Management: Implement basic CRUD operations for internal staff profiles and manage 'admin'/'staff' roles using Firebase custom claims and the mgmt_staff collection.
- Project Quick-Add & Listing: Allow staff to create new projects via a 'Quick Add Project' modal, including initial customer details and status. Display a responsive list of all projects from mgmt_projects.
- AI Email Project Initiation Tool: Utilize a generative AI tool to process incoming inquiry emails, automatically extracting key customer details and proposed project information to pre-fill the 'Quick Add Project' form.
- Project Details & Status Update: View comprehensive details for a single project, incorporating read-only data from existing Chrysalis users and bookings collections. Enable lifecycle status updates for projects.
- Basic Costing Set Management: Enable creation and management of a single mgmt_costing_set per project, including adding line items (mgmt_costing_items) with basic cost and selling price calculations.
- Core Task Tracking: Allow creation, assignment, and status updates (e.g., 'Ready for Verification', 'Approved') for mgmt_tasks to manage project workflows.
- MVP Dashboards: Display a simplified 'My Work Dashboard' showing personal tasks across projects and a high-level 'Management Dashboard' for overall project status.

## Style Guidelines:

- The portal uses a light color scheme inspired by growth and professionalism. The primary interactive color is a muted, deep teal-blue (#2D5A69), offering a sense of stability. The background is a very light, desaturated blue-grey (#EEF3F5), promoting clarity. An accent color, a lively green-cyan (#61CCB3), is used for important actions and highlights to provide subtle contrast and energy.
- Body and headline font: 'Inter' (sans-serif), chosen for its modern, objective, and highly legible appearance suitable for a data-intensive internal application. Code snippets (if any): 'Source Code Pro' (monospace) for clarity and readability.
- Utilize clean, functional outline-style icons from libraries like Lucide (commonly used with shadcn/ui) to ensure intuitive navigation and maintain a consistent, minimalist aesthetic across the application.
- A responsive two-column layout features a persistent, collapsible sidebar for primary navigation and a main content area optimized for data display and forms. Layouts will leverage shadcn/ui components for a cohesive, modern user experience on various screen sizes.
- Implement subtle and efficient micro-animations for interactive elements such as button presses, modal transitions, and navigation expansions/collapses. These animations aim to provide feedback and enhance perceived performance without introducing visual distractions for staff users.
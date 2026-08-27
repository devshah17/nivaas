# Tiffin & Rental Management Web App — Feature Roadmap

Build a modern, minimal, easy-to-use web application for **Tiffin Management and Rental Management**.

The application should be designed as a multi-organization platform where a user can either:
1. Create an organization and become its Creator/Admin.
2. Join an existing organization as a Member/Customer.

The main goal is **simple management with minimum effort**. Avoid unnecessary complexity and do not add features that are not explicitly requested.

---

## Core UI Principle

The application should be:
* Minimal
* Modern
* Fast
* Mobile-friendly
* Easy to understand
* Few clicks for common actions
* Clean dashboard
* Clear typography and spacing
* No unnecessary forms
* No unnecessary settings

The primary navigation should be:
**Dashboard → Tiffins → Rentals → Bills**
Additional sections such as Members and Settings can exist where required.

---

# DEVELOPMENT RULE

Build the application **ONE FEATURE AT A TIME**.
Do NOT implement everything at once.

Before starting:
1. Analyze the existing project.
2. Understand the current tech stack and architecture.
3. Identify what is already implemented.
4. Do not rewrite working code unnecessarily.
5. Follow the existing project structure and conventions.
6. Start with the first feature listed below.
7. After completing a feature:
   * Test it.
   * Fix errors.
   * Verify the UI.
   * Verify edge cases.
   * Ensure existing functionality still works.
8. Only then move to the next feature.
9. Do not implement future features early.
10. Keep the application functional after every stage.

When I say **"next"**, implement only the next feature.

---

# FEATURE ROADMAP

## [x] 01 — Authentication
Implement:
* Sign up
* Login
* Logout
* Forgot password
* User profile
* Protected routes
Create the basic user structure required for the rest of the application.
Do not add unnecessary authentication features.

---

## [x] 02 — Organization
Implement:
* Create organization
* Join organization
* Join request
* Admin approval/rejection
* Organization members
* Leave organization
* Organization switching if required

Roles:
* Creator/Admin
* Member/Customer
The creator automatically becomes the organization admin.
A user joining an organization should initially have a pending request.
The admin must approve the request before the user becomes an active member.

---

## [ ] 03 — Role-Based Dashboard
Create different dashboards depending on the user's role.

### Admin Dashboard
Show:
* Total members/tenants
* Today's tiffins
* Monthly tiffin revenue
* Monthly rent collected
* Pending payments
* Total outstanding amount
* Occupancy overview
* Basic monthly charts

### Member/Customer Dashboard
Show:
* Current month tiffin consumption
* Estimated tiffin bill
* Monthly rent
* Other charges
* Total estimated bill
* Amount paid
* Amount pending
* Consumption history
* Bill history
* Basic monthly charts

A customer should NOT see admin management functionality.

---

## [ ] 04 — Tiffin Management
Implement:
* Daily tiffin entries
* Lunch tracking
* Dinner tracking
* Customer-wise tiffin consumption
* Mark consumed/not consumed
* Tiffin cancellation
* Extra tiffin
* Daily tiffin count
* Monthly consumption
* Customer consumption history

The admin should be able to quickly mark tiffins without filling large forms.
Prefer simple interactions such as:
```text
Customer       Lunch       Dinner
Rahul            ✓           ✓
Amit             ✓           -
Dev              ✓           ✓
```

---

## [ ] 05 — Tiffin Pricing
Implement historical pricing.
Do NOT store only one global tiffin price.
Example:
Aug 01 → ₹80
Aug 15 → ₹85
Sep 01 → ₹90

The price applicable to a tiffin must depend on the date of that tiffin.
For example:
Aug 10 tiffin → ₹80
Aug 20 tiffin → ₹85
Sep 05 tiffin → ₹90

When the admin changes the price, the new price should apply only from the selected date/entry onwards.
Old consumption records and bills must NOT change when a new price is introduced.

---

## [ ] 06 — Tiffin Analytics
Add basic analytics.

Admin:
* Total tiffins this month
* Average tiffins/day
* Lunch vs dinner
* Total tiffin cost
* Daily consumption graph
* Monthly consumption comparison
* Member-wise consumption

Customer:
* Monthly tiffins
* Monthly tiffin spending
* Consumption trend
* Consumption history
Keep charts simple and useful.

---

## [ ] 07 — Rental Management
Implement:
* Properties
* Rooms/units
* Tenants
* Assign tenant to room/unit
* Monthly rent
* Rent due date
* Rent paid/pending
* Record rent payment
* Other monthly charges
* Tenant rental history
* Vacant/occupied units
* Automatic monthly rent calculation

Basic structure:
Property
  └── Room/Unit
        └── Tenant

Keep the structure flexible enough for both rooms and rental units.

---

## [ ] 08 — Rental Analytics
Admin analytics:
* Total properties
* Total rooms/units
* Occupied units
* Vacant units
* Monthly rent collected
* Monthly rent pending
* Total outstanding rent
* Occupancy percentage
* Monthly rent collection graph

Customer analytics:
* Current rent
* Rent history
* Amount paid
* Amount pending
* Monthly rental history

---

## [ ] 09 — Billing
Create a unified billing system.
Automatically calculate:
Tiffin
+ Rent
+ Other charges
- Payments
= Outstanding amount

Example:
August Bill
Tiffin       ₹3,240
Rent        ₹10,000
Other          ₹500
-------------------
Total       ₹13,740
Paid         ₹8,000
Pending      ₹5,740

Implement:
* Automatic tiffin calculation
* Automatic rent calculation
* Other charges
* Combined monthly bill
* Paid amount
* Pending amount
* Bill history
* Customer-wise billing history

The billing system must respect historical tiffin pricing.

---

## [ ] 10 — Admin Management
Create a simple member/tenant management interface.
Admin can:
* View all members
* View individual member
* Approve join requests
* Reject join requests
* Add/remove tenant
* View individual consumption
* View individual bills
* Edit tiffin consumption
* Edit rent
* Record payments
* View billing history
Keep this interface simple and searchable.

---

## [ ] 11 — Final Dashboard Analytics
Once all modules exist, improve the dashboard with meaningful aggregated data.

### Admin
Show:
* Total revenue
* Total outstanding
* Tiffin consumption
* Tiffin revenue
* Rent collected
* Rent pending
* Occupancy
* Monthly trends
* Member-wise outstanding amounts

### Customer
Show:
* Current month tiffins
* Tiffin spending
* Rent
* Other charges
* Total bill
* Paid amount
* Pending amount
* Consumption trend
* Payment/billing history

---

# DATA & BILLING RULES
Follow these principles carefully:
### Historical Pricing
Never overwrite historical tiffin prices.
Every tiffin consumption record should be associated with the applicable price for its date.

### Bills
Previously generated/recorded bills should not unexpectedly change because of future price changes.

### Payments
Payments must be recorded separately from bills.

### Consumption
Tiffin consumption must be stored per customer and date.

### Organization Isolation
Users must only be able to access data belonging to organizations they are members of.

### Permissions
Customers must not be able to access admin-only functionality.

---

# UI REQUIREMENTS
Use a clean SaaS-style interface.
Main navigation:
Dashboard | Tiffins | Rentals | Bills | Members

Admin may see all sections.
Customers should see only relevant sections:
Dashboard | My Tiffins | My Rent | My Bills

Use:
* Cards
* Tables
* Simple charts
* Tabs
* Modals/drawers where appropriate
* Confirmation dialogs for destructive actions

Avoid:
* Huge forms
* Unnecessary animations
* Excessive popups
* Complicated navigation
* Unnecessary configuration
* Features outside this roadmap

---

# IMPORTANT DEVELOPMENT BEHAVIOR
Do not assume missing requirements.
If something is not specified, choose the simplest reasonable implementation that fits the existing architecture.
Do not add: Email systems, GST, WhatsApp, Advanced notifications, Complex accounting, Advanced permissions, Subscription billing, Payment gateways, Unrequested integrations. Focus on making the core Tiffin + Rental + Billing workflow extremely simple and reliable.

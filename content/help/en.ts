import type { HelpContent } from "./types";

// Help centre — English. Button and tab names (in bold) must match the dashboard
// (dictionaries/en.ts). The planning tabs are still hard-coded in Portuguese in
// the dashboard (Orçamento, Tarefas…), so they are quoted as they appear, with
// the English meaning in brackets.

export const helpEn: HelpContent = {
  ui: {
    eyebrow: "Help",
    title: "Help centre",
    subtitle: "Step-by-step answers for every part of the platform, from your first invitation to the wedding day.",
    searchPlaceholder: "Search, for example: guests, QR, tables…",
    searchLabel: "Search the help centre",
    noResults: "We couldn't find anything for “{q}”. Try other words or pick a chapter.",
    resultsCount: "{n} result(s)",
    articlesCount: "{n} articles",
    popularTitle: "Start here",
    stepsTitle: "Step by step",
    tipsTitle: "Tips",
    faqTitle: "Frequently asked questions",
    relatedTitle: "See also",
    inThisChapter: "In this chapter",
    backToHelp: "Help centre",
    stillNeedHelp: "Still have questions?",
    stillNeedHelpDesc: "Write to us and we'll reply as soon as we can.",
    contactBtn: "Contact us",
    forAgenciesBadge: "For agencies",
    metaTitleSuffix: "Help centre",
    metaDescription: "Step-by-step guides to create your digital invitation, manage guests and tables, share photos and more.",
    drawerClose: "Close help",
    drawerOpenInCenter: "Open in the help centre",
    drawerLoading: "Loading...",
    drawerMissing: "This article is not available.",
  },

  chapters: [
    { id: "start", title: "Getting started", desc: "From creating the event to sending the invitation, and how the dashboard is organised." },
    { id: "invite", title: "Wedding invitation", desc: "Template, colours, texts, photos and access to the invitation." },
    { id: "save_the_date", title: "Save the Date", desc: "The card that announces your date to guests." },
    { id: "guests", title: "Guests & tables", desc: "List, RSVPs, personalised links and the seating plan." },
    { id: "photos", title: "Photos & Live Wall", desc: "Guests share photos and videos; you project them at the party." },
    { id: "guestbook", title: "Guestbook", desc: "Text, voice and video messages from your guests." },
    { id: "share", title: "Share & send", desc: "All links and QR codes, and how to reach your guests." },
    { id: "account", title: "Account & payments", desc: "Modules, team, password and deadlines." },
    { id: "agencies", title: "For agencies", desc: "The Planning area for wedding planners and agencies." },
  ],

  articles: [
    // ───────────── GETTING STARTED ─────────────
    {
      slug: "first-steps",
      chapter: "start",
      popular: true,
      title: "From zero to invitation sent: the 5 steps",
      summary: "The shortest path to having your invitation ready and in your guests' hands.",
      steps: [
        "**Create the event** with the names, the date and the invitation link (see “How do I create my event?”).",
        "**Fill in the invitation:** pick a template and write the texts and add the photos in the **Wedding invitation** area.",
        "**Add your guests** in the **Guests & tables** area, organised in groups (families or couples).",
        "**Check everything in the phone preview** next to the editor, and open the invitation to see it as your guests will.",
        "**Share the link.** It's in the **Links & QR codes** area.",
      ],
      tips: [
        "The **What's left to do** list at the top of the dashboard home page follows these steps and takes you straight to each one.",
        "You can change the texts and photos after sending the link: anyone who opens the invitation always sees the latest version.",
      ],
      faq: [
        { q: "Do I have to do it all at once?", a: "No. The dashboard saves on its own and you can come back whenever you like." },
        { q: "Do guests need to install an app?", a: "No. The invitation is a website that opens in the browser of any phone or computer." },
      ],
      related: ["create-event", "panel-overview", "send-invite"],
    },
    {
      slug: "create-event",
      chapter: "start",
      popular: true,
      title: "How do I create my event?",
      summary: "An event is your wedding: it has an invitation, a guest list and a management dashboard.",
      steps: [
        "Log in to your account (or create one with **Create account here**) and open **My Projects**.",
        "Click **New Event**.",
        "Enter both names and the **Wedding Date**.",
        "Choose the **Custom Link**, for example `jane-and-tom`. It's the address your guests will receive.",
        "Click **Generate my Digital Invitation**.",
      ],
      tips: [
        "The link can't be repeated. If it's already in use, add a number or change a word.",
        "Pick a short link that's easy to read: it will be sent to everyone.",
        "Each event lives in **My Projects**. Events other people have shared with you appear under **Shared With Me**.",
        "The day after the wedding, the event moves to the **Archived** tab. It stays available until 60 days after the event.",
      ],
      faq: [
        { q: "Can I change the link after creating the event?", a: "The link is set when the event is created, so choose it carefully. If you really need to change it, contact us." },
        { q: "Can I change the date later?", a: "Yes, as long as no module is active. See “Can I change the wedding date?”." },
      ],
      related: ["panel-overview", "change-date"],
    },
    {
      slug: "panel-overview",
      chapter: "start",
      title: "How is the dashboard organised?",
      summary: "A home page with one area for each part of the wedding.",
      shots: [
        { file: "hub", alt: "Home page of the dashboard, with the “What’s left to do” list and a card for each area." },
      ],
      steps: [
        "When you open an event you land on **What would you like to manage?**, with one card per area: **Save the Date**, **Wedding invitation**, **Guests & tables**, **Photo Sharing & Live Wall**, **Guestbook** and **Links & QR codes**.",
        "At the top, the **What's left to do** list shows the steps still missing and takes you to each one.",
        "Click a card to enter that area. Inside, the menu on the left switches tabs and **Areas** goes back to the home page. On small screens the menu is at the bottom.",
        "In the **Invitation**, the phone on the right shows the invitation as guests will see it and refreshes by itself after saving.",
        "**My Account**, at the bottom of the menu, has four blocks: **Your plan**, **Payments**, **Event team** and **Your details**.",
      ],
      tips: [
        "You can prepare everything before paying. For guests to open the invitation, click **Publish invitation**.",
        "The **?** button, at the top right of the home page, replays the welcome tour.",
        "Changes save on their own. The status shows at the top: **Saving...** and then **Saved**.",
      ],
      related: ["first-steps", "buy-modules", "links-qr"],
    },

    // ───────────── INVITATION ─────────────
    {
      slug: "choose-template",
      chapter: "invite",
      title: "How do I choose the template and colour?",
      summary: "The template sets the look of the invitation. Slots marked **Coming soon** are new templates on their way.",
      shots: [
        { file: "invite-design", alt: "The “Models & identity” tab of the invitation, with the phone preview alongside." },
      ],
      steps: [
        "Open **Wedding invitation** and, in the switch above the editor, pick **Models & identity**.",
        "Under **Invitation Templates**, click the template you like.",
        "Click **Apply Template**. The phone next to it shows the result straight away.",
        "On templates that allow it, adjust the **Accent Colour**. You can also pick a **Custom** colour.",
      ],
      tips: [
        "The texts and photos you've already added aren't lost when you change template.",
        "The accent colour only exists on some templates. If the section doesn't appear, the chosen template doesn't have it.",
        "Want a design of your own? Request a bespoke invitation proposal from **Contact**.",
      ],
      related: ["edit-content", "preview"],
    },
    {
      slug: "edit-content",
      chapter: "invite",
      popular: true,
      title: "How do I edit the invitation texts and photos?",
      summary: "The editor has one section for each part of the invitation. The phone next to it shows the result.",
      shots: [
        { file: "invite-content", alt: "The invitation content editor, with the sections on the left and the phone preview." },
      ],
      steps: [
        "Open **Wedding invitation** and, in the switch above the editor, pick **Invitation content**.",
        "The editor has one section for each part of the invitation, in this order: **Cover (Hero)**, **Countdown**, **Our Story**, **Editorial Gallery**, **Schedule**, **Event Venues**, **Event Details**, **RSVP Confirmation** and **Footer & Contacts**. Click one to open it.",
        "Write the texts and upload the photos. On the cover you can use a photo or an `.mp4` video; in the gallery, up to 5 photos.",
        "There is no save button: the dashboard saves on its own a few seconds after you stop typing. **Saved** appears at the top.",
        "Check the result on the phone next to it.",
      ],
      tips: [
        "In **Event Venues** you can add the **Google Maps Link** for the ceremony and the reception.",
        "**Event Details** has **Logistics & Parking**, **Accommodation**, **Dress Code & Colors** and **Gifts & IBAN**. The IBAN button only appears if you turn it on.",
        "To hide a section without deleting it, see “How do I hide a section of the invitation?”.",
      ],
      faq: [
        { q: "Do I have to click a button to save?", a: "No. The dashboard saves on its own. If you see **Saving...** at the top, just wait a moment." },
        { q: "Can I change the texts after sending the link?", a: "Yes. Anyone who opens the invitation will see the new version." },
      ],
      related: ["hide-sections", "preview", "choose-template"],
    },
    {
      slug: "hide-sections",
      chapter: "invite",
      title: "How do I hide a section of the invitation?",
      summary: "Each section of the invitation can be shown or hidden without losing what you wrote.",
      steps: [
        "Open **Wedding invitation** › **Invitation content**.",
        "Each section has a **Visible / Hidden** switch next to its title.",
        "Turn off the ones you don't want to show (for example, the **Editorial Gallery**).",
        "The section disappears from the invitation straight away.",
      ],
      tips: ["What you wrote in that section is kept. You can turn it back on whenever you like."],
      related: ["edit-content"],
    },
    {
      slug: "preview",
      chapter: "invite",
      title: "How do I see the invitation as guests will see it?",
      summary: "The preview shows the real invitation, in a phone-sized frame.",
      steps: [
        "In the **Wedding invitation**, the phone on the right shows the real invitation and refreshes after each save.",
        "On small screens, click **View Preview** at the top to open it.",
        "To see it full screen, click **Open Invite** at the top right.",
        "Also open the link on your own phone to try it out as a guest.",
      ],
      tips: [
        "If you turn on the access code, the preview and the **Open Invite** button open without asking for it. Only guests need it.",
        "In the preview the invitation stays where it was (for example, the envelope open) when you save a change.",
      ],
      related: ["edit-content", "access-code"],
    },
    {
      slug: "access-code",
      chapter: "invite",
      title: "How do I protect the invitation with a code?",
      summary: "A 4-digit code asked of anyone opening the invitation, so the link can go around without the invitation being open to everyone.",
      shots: [
        { file: "access-card", alt: "The “Invitation access” card with the code switched on." },
        { file: "access-gate", alt: "What someone opening the invitation without the code sees: just a code prompt, with no event details." },
      ],
      steps: [
        "Open **Links & QR codes**.",
        "On the **Invitation access** card, turn the switch on. A 4-digit code is generated.",
        "If you prefer another one, type it in **Change code** and click **Save**.",
        "To send it, use **Copy link and code**.",
      ],
      tips: [
        "The code is off by default. It's only asked for once you turn it on.",
        "Changing the code makes anyone who had already got in enter it again.",
        "The code applies to the invitation, including personalised links. The gallery, the standalone RSVP page, the seating plan and the guestbook have their own links and don't ask for a code.",
        "With 4 digits, the code is meant to prevent casual access, such as a forwarded link. Don't treat it as a password.",
      ],
      faq: [
        { q: "What does someone without the code see?", a: "Only a page asking for the code, with no names, date or photos." },
        { q: "What if someone tries to guess it?", a: "After 5 failed attempts, that person has to wait about 15 minutes." },
        { q: "Does the code stop guests from forwarding the invitation?", a: "It doesn't stop them, but anyone who gets the link without the code can't open the invitation." },
      ],
      related: ["send-invite", "personal-links"],
    },
    {
      slug: "change-date",
      chapter: "invite",
      title: "Can I change the wedding date?",
      summary: "Yes, as long as no module is active yet. After the first purchase the date is locked.",
      steps: [
        "Open **Wedding invitation** › **Models & identity**.",
        "Under **Wedding Identity**, change **The Big Day Date**.",
      ],
      tips: [
        "After the first purchase you'll see the note “Date locked after the first purchase”. If you need to change it, contact us.",
        "That's also where you correct the couple's names.",
      ],
      related: ["create-event", "buy-modules"],
    },

    // ───────────── SAVE THE DATE ─────────────
    {
      slug: "save-the-date",
      chapter: "save_the_date",
      title: "How do I create and download the Save the Date?",
      summary: "An elegant card with your photo and names, ready to send by message or print.",
      steps: [
        "Open the **Save the Date** area.",
        "Choose the card **Template**.",
        "Upload your photo with **Upload photo**. A vertical photo works best.",
        "If needed, use **Adjust framing**: drag the photo and use the slider to zoom.",
        "Enter the **City / Location**.",
        "Check the result under **Preview** and click **Download PDF**.",
      ],
      tips: [
        "The names and date come from the event, so you don't type them here. To change them, see “Can I change the wedding date?”.",
        "If the photo is badly framed, **Reset to centre** starts over.",
      ],
      faq: [{ q: "What format is the card in?", a: "A PDF file, ready to send or print." }],
      related: ["change-date", "send-invite"],
    },

    // ───────────── GUESTS & TABLES ─────────────
    {
      slug: "add-guests",
      chapter: "guests",
      popular: true,
      title: "How do I add guests and groups?",
      summary: "Guests are organised in groups (a family, a couple). It's the group that answers the RSVP.",
      shots: [
        { file: "guests-list", alt: "The Guests tab: data tools, the “Add to List” form and the guest table." },
      ],
      steps: [
        "Open **Guests & tables** and the **Guests** tab.",
        "Under **Add to List**, enter the **Name** and choose the **Category** (**Adult**, **Child** or **Baby**), the **Gender** and the **Side**.",
        "If they're a family or a couple, enter a **Group Label** (for example, *Silva Family*) and click **Add Another to Group** to add more people to the same group.",
        "Click **Save Guest(s)**.",
        "You can add **Dietary Restrictions** and **Notes / Observations** for each person.",
      ],
      tips: [
        "When a guest confirms attendance, they see their whole group and answer for each person.",
        "To edit or delete someone, use the icons at the end of each table row.",
        "The **RSVP Summary** panel shows the total expected, **Confirmed**, **Pending** and **Declined**.",
        "You can create your own side and dietary tags under **Manage Tags**.",
      ],
      faq: [
        { q: "Do babies count as a seat?", a: "In the statistics they appear under **Babies**. In personalised links, the seats reserved count adults and children, not babies, and you can correct the number." },
        { q: "Can I add a whole list at once?", a: "Yes, by importing an Excel file. See “How do I import and export the guest list?”." },
      ],
      related: ["import-export", "rsvp", "seating"],
    },
    {
      slug: "import-export",
      chapter: "guests",
      title: "How do I import and export the guest list?",
      summary: "You can bring your list in from an Excel file and take it back out as Excel or PDF.",
      shots: [
        { file: "guests-tools", alt: "The “Data Tools” bar, with the export (PDF and Excel) and import options." },
      ],
      steps: [
        "In **Guests & tables** › **Guests**, open **Data Tools**.",
        "To import: click **Download Template**, fill in the Excel file and click **Import Excel**.",
        "To export: choose **Full Excel** or **Export PDF**. For the PDF you can pick **Confirmed Only**, **Conf. + Pending** or **Full Active List**.",
      ],
      tips: [
        "Always use the template so the import works first time.",
        "The confirmed-only PDF is handy to send to the venue or the caterer.",
      ],
      related: ["add-guests", "rsvp"],
    },
    {
      slug: "rsvp",
      chapter: "guests",
      popular: true,
      title: "How do guests confirm attendance?",
      summary: "Guests look up their name, choose Attending or Not attending for each person in the group, and the answers reach your dashboard.",
      shots: [
        { file: "rsvp-group", alt: "What a guest sees when opening their group’s link: each person chooses “Attending!” or “Not attending”." },
      ],
      steps: [
        "Guests open the invitation and go to the confirmation section (**RSVP**), or use the standalone confirmation page, reached by QR code.",
        "They type their name (3 letters or more) and pick themselves from the list.",
        "They see the whole group and, for each person, choose **Attending!** or **Not attending**. They can add dietary restrictions and notes.",
        "The answers appear in **Guests & tables** › **Guests**, with the status **Confirmed** or **Declined**.",
        "Anyone who can't find their name can request access. Requests appear under **Access Requests**, where you can **Approve** (the person joins the list) or **Dismiss**.",
      ],
      tips: [
        "The QR code for the standalone confirmation page is in **Guests** and in **Links & QR codes**. It's ideal for a printed invitation.",
        "So guests don't have to look up their name, create personalised links.",
        "To chase guests who haven't answered, use **Remind who's missing** in **Personalised links**: it gives you a ready message per group.",
      ],
      faq: [
        { q: "Can guests change their answer?", a: "Yes. After saving, a **Change responses** button appears. They can also reopen the RSVP later." },
        { q: "Do I need the Invitation module to use the RSVP?", a: "The standalone confirmation page only needs **Guests & tables**. Inside the invitation, the confirmation is part of it." },
      ],
      related: ["personal-links", "add-guests", "links-qr"],
    },
    {
      slug: "personal-links",
      chapter: "guests",
      popular: true,
      title: "How do I create personalised links for each guest?",
      summary: "One link per group: the RSVP opens straight on the right group and, on some templates, the invitation shows the name and the seats reserved.",
      shots: [
        { file: "guest-links", alt: "The “Personalised links” card, with each group’s link and the “Seen” column." },
      ],
      steps: [
        "Open **Guests & tables** and, at the top, the **Personalised links** card. Click **Set up**.",
        "Click **Generate missing links**. Each group gets its own link.",
        "If you like, correct what appears on the entrance screen under **Name on invitation** and **Seats**. By default, the name comes from the group's first names and the seats count adults and children.",
        "Copy each group's link or click **Export list (CSV)** to get names and links in a spreadsheet.",
        "Send each group its link.",
      ],
      tips: [
        "It's optional. If you prefer, keep sending a single link to everyone, and guests look up their name in the RSVP.",
        "**New link** generates a different link (the old one stops working). **Remove** deletes the group's link.",
        "**Remind who's missing** (on the same card) lists groups with guests still to answer, those who never opened their link first, each with a ready message (name, personal link and deadline) to copy and send by WhatsApp, text or email. You can edit the message, and the dashboard marks who you've already reminded.",
        "On some templates, the entrance screen shows the group name and “We have reserved 2 seats for you”. On all templates, the RSVP opens straight on the right group.",
      ],
      faq: [
        { q: "What if I change the group after sending the link?", a: "The link keeps working and always shows the group's current details." },
        { q: "Do personal links ask for the access code?", a: "Yes, if the code is on. Anyone opening a personal link also has to enter it." },
        { q: "Do new guests have no link?", a: "Right, until you click **Generate missing links** again, which only creates the missing ones." },
      ],
      related: ["track-opens", "access-code", "send-invite"],
    },
    {
      slug: "track-opens",
      chapter: "guests",
      title: "How do I know who has opened the invitation?",
      summary: "With personalised links, the dashboard shows which groups have opened the invitation and when.",
      steps: [
        "In **Guests & tables**, open **Personalised links**.",
        "The **Seen** column shows each group's last opening and how many times they opened it. The summary at the top says how many groups have opened it.",
        "Tick **Only those who have not opened it** to see who to remind.",
      ],
      tips: [
        "It only works for people using a personalised link. With the general link there's no way to tell who opened it.",
        "We only keep dates and counts, without identifying the person or the device.",
        "If you open the link to test it, that counts as an opening too.",
      ],
      related: ["personal-links"],
    },
    {
      slug: "seating",
      chapter: "guests",
      title: "How do I organise the tables?",
      summary: "Design the floor plan, seat guests by dragging them, and share each person's table by QR code.",
      shots: [
        { file: "seating-plan", alt: "The Tables tab: the floor plan with the tables and the guests still to seat." },
      ],
      steps: [
        "Open **Guests & tables** and the **Tables** tab.",
        "Under **Add Tables**, choose a **Round**, **Square** or **Long** table. The table is selected so you can give it a name and number of seats.",
        "Drag the tables to the right spot on the **Floor Plan**.",
        "Drag guests from **Guests to Seat** onto a table. Use the search to find them.",
        "Follow progress under **Seated** and **No Table**. The **Organisational Report** tab lists who is at each table.",
        "Export everything with **Export Premium PDF**.",
      ],
      tips: [
        "When a table is full it won't take anyone else (you'll see “Table is full!”).",
        "Dragging works with a mouse and with a finger, on a phone or tablet.",
        "The **Digital Seating Chart** QR code lets guests check their table on their phone at the entrance, without crowding round a printed board.",
      ],
      related: ["add-guests", "links-qr"],
    },

    // ───────────── PHOTOS & LIVE WALL ─────────────
    {
      slug: "photo-sharing",
      chapter: "photos",
      title: "How do photo sharing and the Live Wall work?",
      summary: "Guests send photos and videos by QR code and you project them at the party in real time.",
      steps: [
        "Open **Photo Sharing & Live Wall**.",
        "Copy the **Public Photo Sharing Page** link or download the QR code (PNG or SVG) to print and put on the tables.",
        "Guests scan the QR code with their phone and send the photos and videos they've taken.",
        "For the party, open the **Live Wall** on a screen or projector: it shows moments as they arrive.",
      ],
      tips: [
        "The **Live Wall** link is different from the gallery's. Each has its own **Copy Link** and **Open Direct**.",
        "Under **Content Management** you can customise the profile photo of the galleries.",
      ],
      related: ["manage-photos", "links-qr"],
    },
    {
      slug: "manage-photos",
      chapter: "photos",
      title: "How do I download or delete guests' photos?",
      summary: "Everything guests send is kept in the dashboard, for you to save or clear.",
      steps: [
        "Open **Photo Sharing & Live Wall** and go to the **Moments Grid**.",
        "To download everything, click **ZIP**.",
        "To save just one, open the photo and click **Save**.",
        "To delete a file, use the bin icon and confirm.",
      ],
      tips: ["Deleting removes the file permanently. Download first whatever you want to keep."],
      related: ["photo-sharing"],
    },

    // ───────────── GUESTBOOK ─────────────
    {
      slug: "guestbook",
      chapter: "guestbook",
      title: "How does the guestbook work?",
      summary: "Guests leave a message in text, voice or video, and you keep them as a memento.",
      steps: [
        "Open **Guestbook**.",
        "Copy the **Guestbook Page** link or download the QR code (PNG or SVG) to print.",
        "Guests open the page and leave their message in text, audio or video.",
        "Under **Guest Messages** read everything, in the **Texts**, **Audios** and **Videos** tabs.",
        "To keep them, click **ZIP this tab**. To delete a message, use the delete icon and confirm.",
      ],
      related: ["links-qr"],
    },

    // ───────────── SHARE & SEND ─────────────
    {
      slug: "links-qr",
      chapter: "share",
      title: "Where do I find all the links and QR codes?",
      summary: "The Links & QR codes area gathers all the event's addresses in one place.",
      shots: [
        { file: "links-hub", alt: "The “Links & QR codes” area, with a card for each event address." },
      ],
      steps: [
        "Open **Links & QR codes** on the dashboard home page.",
        "You'll find six cards: **Invitation**, **RSVP**, **Seating plan**, **Photo gallery**, **Live Wall** and **Guestbook**.",
        "Each card has **Copy link**, **Open** and the QR code, which you can download as **PNG** or **SVG**.",
        "A card marked **Available once published** only works after you click **Publish invitation**.",
      ],
      tips: [
        "For printing (invitations, table cards), prefer the SVG: it stays sharp at any size.",
        "The **Invitation access** card, at the top, turns the invitation code on and off.",
      ],
      related: ["send-invite", "access-code"],
    },
    {
      slug: "send-invite",
      chapter: "share",
      popular: true,
      title: "How do I send the invitation to guests?",
      summary: "There are three ways to get the invitation to each person. You can combine them.",
      steps: [
        "**One link for everyone:** in **Links & QR codes**, click **Copy link** on the **Invitation** card and send it by message or email. Guests look up their name in the RSVP.",
        "**One link per group:** create **Personalised links** (see the article) and send each group its link, or export the list as CSV.",
        "**On paper:** print the RSVP (or invitation) QR code on the physical invitation.",
        "If you've turned on the **access code**, use **Copy link and code** to send both at once.",
      ],
      tips: [
        "Before sending, open the link on your own phone to try it as a guest.",
        "You can fix texts and photos after sending: anyone opening the link always sees the latest version.",
      ],
      related: ["personal-links", "access-code", "links-qr"],
    },

    // ───────────── ACCOUNT & PAYMENTS ─────────────
    {
      slug: "buy-modules",
      chapter: "account",
      audience: "dis",
      title: "When do I pay? How do I publish the invitation?",
      summary: "Preparing is free with no time limit. You pay once, when you publish the invitation: the Full Plan unlocks everything.",
      steps: [
        "While you prepare, you can use the whole dashboard without paying: invitation, guests, seating, Save the Date (with a watermark) and, to try them out, up to 5 photos and 5 guestbook messages.",
        "The **Preview** button shows you the full invitation. Guests can only open it once it's published.",
        "When everything is ready, click **Publish invitation** (at the top of the dashboard, under **Ready to send?** on the dashboard home page, or in **My Account** › **Your plan**).",
        "If you have a promo code, click **I have a promo code** and enter it before paying.",
        "Payment is made on a secure screen. When it finishes, the invitation is published and everything is unlocked: RSVP, Save the Date without watermark, unlimited photos and messages.",
        "In **My Account**, the **Your plan** block shows whether the invitation is published and until when it stays online, and the **Payments** block shows what you have paid.",
      ],
      tips: [
        "The current price is on the **Pricing** page. It's a one-time payment per event, VAT included.",
        "If you had already bought a module on its own, you only pay the difference.",
        "After the first purchase, the wedding date is locked.",
      ],
      faq: [{ q: "Is the purchase recorded?", a: "Yes. Every payment appears under **My Account** › **Payments**, with the status **Paid**, **Pending**, **Failed** or **Refunded**." }],
      related: ["change-date", "panel-overview"],
    },
    {
      slug: "collaborators",
      chapter: "account",
      title: "How do I give someone else access?",
      summary: "You can share the event with your partner, family or a wedding planner.",
      shots: [
        { file: "collaborators", alt: "The “Event team” block in My Account, with the event owner, the email, the permission and the list of people with access." },
      ],
      steps: [
        "Open **My Account** and go to **Event team**.",
        "Enter the person's email.",
        "Choose **Can Edit** (can change everything) or **Read Only** (can only view).",
        "Click **Invite**.",
      ],
      tips: [
        "The person logs in with that email and sees the event under **Shared With Me**. If they don't have an account yet, they create one with the same email.",
        "To take access away, remove the person from the list. Only people who can edit the event can invite or remove others.",
      ],
      related: ["login-password"],
    },
    {
      slug: "login-password",
      chapter: "account",
      title: "How do I recover or change my password?",
      summary: "If you've forgotten it, you get a link by email. If you just want to change it, do it in your account.",
      steps: [
        "**I forgot it:** on the login screen, click **Forgot?**, enter your email and click **Send Recovery Link**.",
        "Open the email (check your spam too) and follow the link to choose a new password.",
        "**I want to change it:** in **My Account** › **Your details**, enter the **New Password** (at least 6 characters) and save.",
      ],
      related: ["collaborators"],
    },
    {
      slug: "expiry",
      chapter: "account",
      title: "How long does the invitation stay online?",
      summary: "The invitation stays available until about 60 days after the wedding.",
      steps: [
        "After that date, anyone opening the invitation sees the message “This invitation is no longer available”.",
        "The dashboard becomes read-only: you can still see everything, but no longer edit.",
        "After that date, photos, videos, messages, the guest list and the invitation texts may be permanently deleted.",
      ],
      tips: [
        "From the day after the wedding, the dashboard shows a notice with the deadline. Before then, download photos and videos in **Photo Sharing & Live Wall** (**ZIP** button) and messages in **Guestbook**.",
        "If you need more time, contact us before the deadline.",
      ],
      related: ["manage-photos", "import-export"],
    },

    // ───────────── FOR AGENCIES ─────────────
    {
      slug: "partner-area",
      chapter: "agencies",
      audience: "agency",
      title: "How does the Partner area work?",
      summary: "Your terms, your referral link and code, your commissions and the events you manage, in one place.",
      steps: [
        "On the events list, click **Partner**.",
        "Under **Your terms** you can see what you have active: the referral commission, the partner price (and from which wedding the volume price applies), Planning and your own brand.",
        "Under **Your referrals** you'll find your link and your code, with **Copy** and the QR code. Couples who arrive through your link, or type your code when they pay, are linked to you.",
        "The table shows each referred couple who has published: the wedding date, the amount paid and the commission, with its status (**Pending**, **Approved**, **Paid** or **Cancelled**).",
        "Under **Your events** are the weddings you manage, with who pays to publish and how much it cost.",
        "In one of your events, choose under **Who pays to publish this invitation?** whether you publish it (**The agency**, at your partner price) or **The couple** does. The question also appears when you click **Publish invitation**; if you choose **The couple**, invite them under **My Account** › **Event team** so they can publish and pay from their dashboard.",
      ],
      tips: [
        "A commission is approved 14 days after the payment and paid by bank transfer once a month. You need to send us an invoice or receipt.",
        "On your own events: if you publish, you pay your partner price and there is no commission; if you choose **The couple**, they pay the normal price and you get the commission (with referrals switched on).",
        "To change your billing details (VAT no., IBAN), contact us.",
      ],
      related: ["planning-overview"],
    },
    {
      slug: "planning-overview",
      chapter: "agencies",
      audience: "agency",
      title: "What is the Planning area?",
      summary: "An area only for agency accounts, to manage each wedding's budget, tasks and vendors.",
      steps: [
        "Inside an event, open **Planeamento** (Planning).",
        "**Orçamento** (Budget): costs per vendor, tiers for adult, child and baby, payments, contracts, notes and documents.",
        "**Tarefas** (Tasks): the event checklist. Dates recalculate if the wedding date changes.",
        "**Cronograma** (Schedule): the day's timetable. The agency can hide blocks from the couple (for example, surprises).",
        "**Partilha** (Sharing): the links for vendors and for the moodboard.",
        "**Inspiração** (Inspiration): the moodboard, shared with the couple and organised in sections.",
      ],
      tips: [
        "On the events list, the **Wedding Planner** menu has **This week** (every wedding at a glance, with a traffic light, tasks, payments and guest signals) and **Vendors** (the agency's directory, with price history).",
        "These areas only appear on agency accounts (and to the platform administrator). Couples don't see them.",
      ],
      related: ["this-week", "reuse-planning", "vendor-sharing"],
    },
    {
      slug: "reuse-planning",
      chapter: "agencies",
      audience: "agency",
      title: "How do I reuse the checklist and budget from another wedding?",
      summary: "Copy from a previous wedding or import from Excel, so you don't start every wedding from scratch.",
      steps: [
        "**Copy the checklist:** in **Planeamento** (Planning) › **Tarefas** (Tasks), click **Copiar de outro casamento** (copy from another wedding), choose the wedding and confirm. Tasks go back to “to do” and deadlines count from this wedding's date.",
        "**Copy the budget:** in **Planeamento** › **Orçamento** (Budget), click **Copiar de outro casamento** (next to **Adicionar custo**). Prices, calculation mode and VAT are copied; the status goes back to “to quote” and payments, notes and documents are not copied.",
        "**Import the checklist from Excel:** in **Tarefas**, click **Modelo Excel** (Excel template), fill it in (task, days before the wedding or due date, priority, owner, notes) and click **Importar Excel**.",
        "**Import your vendors:** in **Wedding Planner** › **Vendors**, the same: **Excel template** and then **Import Excel**. Vendors already in the directory (same name) are skipped.",
      ],
      tips: [
        "Copying and importing always add to what's there: they never delete anything.",
        "Only weddings from the same agency are offered for copying.",
        "In Excel, headers can be in Portuguese or English. Rows with problems are skipped and the dashboard tells you which ones and why.",
        "A good habit: set up a “template” wedding with your full method and copy it into every new wedding.",
      ],
      related: ["planning-overview", "this-week"],
    },
    {
      slug: "this-week",
      chapter: "agencies",
      audience: "agency",
      title: "How do I use the This week screen?",
      summary: "The wedding planner's morning screen: every wedding at a glance, what is late, what is coming and what the guests are doing.",
      steps: [
        "On the events list, open the **Wedding Planner** menu and choose **This week**.",
        "Under **Your weddings**, each wedding has a traffic light. **Red**: something is already late (overdue task or payment, budget over 100%, RSVP deadline passed with guests still to answer). **Amber**: needs attention soon (budget at 85% or more, RSVP closing with few answers, access requests, deadlines in the next 7 days). **Green**: on track. Red ones come first.",
        "Under **Agency tasks** and **Payments to vendors**, mark items as done or paid without leaving the list. If it was a mistake, click **Undo**.",
        "Click a task or a payment to open the wedding straight on the right tab (Tasks or Budget).",
        "Under **Guest signals**, see RSVPs closing, new answers from the last 24 hours, groups that haven't opened their personal link and access requests waiting for approval.",
        "Under **Waiting on the couple** are the tasks whose owner is the couple, overdue or due within 14 days: your list of things to chase.",
      ],
      tips: [
        "For the RSVP warnings to work, fill in **Deadline (for reminders)** under **Wedding invitation** › **Invitation content** › **RSVP Confirmation**. It isn't shown on the invitation.",
        "Unopened-link signals only appear for weddings with **Personalised links**, and once at least one group has opened theirs.",
        "Past weddings stay here for 30 days, because final payments are often due after the day.",
      ],
      related: ["planning-overview", "personal-links", "track-opens"],
    },
    {
      slug: "vendor-sharing",
      chapter: "agencies",
      audience: "agency",
      title: "How do I share information with vendors and the couple?",
      summary: "No-login links for vendors and for the moodboard, managed in one place.",
      steps: [
        "Open **Planeamento** (Planning) › **Partilha** (Sharing).",
        "Create a vendor portal link. Whoever receives it can only read the information the agency shared.",
        "Create the moodboard link. Whoever receives it can view and add images, but not delete.",
        "For the couple to see only what you want, hide the blocks that shouldn't appear in **Cronograma** (Schedule).",
      ],
      tips: ["The links don't need an account. Anyone with the link has access, so share them only with the right people."],
      related: ["planning-overview"],
    },
  ],
};

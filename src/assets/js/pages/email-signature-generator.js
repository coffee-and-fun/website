const { createApp } = Vue;

// ---------- Email-safe HTML helpers ----------
// Everything the generator emits must survive Gmail's sanitizer and
// Outlook desktop's Word rendering engine: nested tables only, styles
// repeated on every td/a, solid colors, web-safe font stacks, image
// width/height attributes, no gradients/border-radius-dependence.
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const safeUrl = (u) => {
  u = String(u == null ? '' : u).trim();
  if (!u) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(u)) return u;
  return 'https://' + u.replace(/^\/+/, '');
};

const FONTS = {
  arial: "Arial, Helvetica, sans-serif",
  segoe: "'Segoe UI', Arial, Helvetica, sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  times: "'Times New Roman', Georgia, serif",
  mono: "'Courier New', Courier, monospace"
};

const td = (fam, size, color, extra) =>
  `font-family:${fam};font-size:${size}px;color:${color};${extra || ''}`;

// Rows-table for contact lines: padding on td is the only spacing
// primitive Word respects.
const rowsTable = (rows) =>
  rows.length
    ? `<table cellpadding="0" cellspacing="0" border="0">${rows.map(r => `<tr><td style="${r.style}">${r.html}</td></tr>`).join('')}</table>`
    : '';

const socialTable = (socials, fam, linkColor, chipBg, chipText) => {
  if (!socials.length) return '';
  const cells = socials.map((s, i) => {
    const spacer = i > 0 ? `<td width="6" style="width:6px;font-size:1px;">&nbsp;</td>` : '';
    if (chipBg) {
      return spacer + `<td bgcolor="${chipBg}" style="background-color:${chipBg};padding:6px 10px;"><a href="${esc(safeUrl(s.url))}" style="${td(fam, 15, chipText)}text-decoration:none;">${s.icon}</a></td>`;
    }
    return spacer + `<td><a href="${esc(safeUrl(s.url))}" style="${td(fam, 17, linkColor)}text-decoration:none;">${s.icon}</a></td>`;
  }).join('');
  return `<table cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>`;
};

const photoImg = (src, size, round, extra) =>
  src
    ? `<img src="${esc(src)}" alt="" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px;${round ? 'border-radius:50%;' : 'border-radius:6px;'}${extra || ''}" />`
    : '';

createApp({
  data() {
    const templates = [
      { id: 'classic',   name: 'Classic',   icon: '📧', description: 'Simple & professional', premium: false },
      { id: 'modern',    name: 'Modern',    icon: '✨', description: 'Clean & minimal',       premium: false },
      { id: 'corporate', name: 'Corporate', icon: '🏢', description: 'Business-focused',      premium: true },
      { id: 'creative',  name: 'Creative',  icon: '🎨', description: 'Colorful & bold',       premium: true },
      { id: 'elegant',   name: 'Elegant',   icon: '💎', description: 'Sophisticated',         premium: true },
      { id: 'tech',      name: 'Tech',      icon: '💻', description: 'Developer-friendly',    premium: true }
    ];

    return {
      hasPremiumAccess: false,
      isProcessingPayment: false,

      selectedTemplate: templates[0],
      templates,

      formData: {
        name: '', title: '', company: '', email: '',
        phone: '', website: '', address: '',
        department: '', pronouns: '', timezone: '', officeHours: '',
        secondaryEmail: '', calendarLink: '', photoUrl: '',
        social: {
          linkedin: '', twitter: '', github: '', instagram: '', facebook: '',
          youtube: '', tiktok: '', medium: '', dribbble: '', whatsapp: '', telegram: ''
        },
        primaryColor: '#96603c',
        textColor: '#1f2937'
      },

      uploadedPhoto: null,
      isPhotoUploading: false,

      socialLinks: [
        { id: 'linkedin',  icon: '💼', placeholder: 'https://linkedin.com/in/yourname', label: 'LinkedIn' },
        { id: 'twitter',   icon: '🐦', placeholder: 'https://twitter.com/yourname',    label: 'Twitter/X' },
        { id: 'github',    icon: '💻', placeholder: 'https://github.com/yourname',     label: 'GitHub' },
        { id: 'instagram', icon: '📸', placeholder: 'https://instagram.com/yourname',  label: 'Instagram' },
        { id: 'facebook',  icon: '👥', placeholder: 'https://facebook.com/yourname',   label: 'Facebook' },
        { id: 'youtube',   icon: '📺', placeholder: 'https://youtube.com/@yourname',   label: 'YouTube' },
        { id: 'tiktok',    icon: '🎵', placeholder: 'https://tiktok.com/@yourname',    label: 'TikTok' },
        { id: 'medium',    icon: '✍️', placeholder: 'https://medium.com/@yourname',    label: 'Medium' },
        { id: 'dribbble',  icon: '🎨', placeholder: 'https://dribbble.com/yourname',   label: 'Dribbble' },
        { id: 'whatsapp',  icon: '💬', placeholder: 'https://wa.me/1234567890',        label: 'WhatsApp' },
        { id: 'telegram',  icon: '✈️', placeholder: 'https://t.me/yourname',           label: 'Telegram' }
      ],
      visibleSocials: ['linkedin', 'twitter', 'github'],

      openMore: false,
      openExtras: false,

      setupTab: 'gmail',
      setupClients: [
        { id: 'gmail', name: 'Gmail' },
        { id: 'outlook', name: 'Outlook' },
        { id: 'apple', name: 'Apple Mail' },
        { id: 'thunderbird', name: 'Thunderbird' }
      ],

      copied: false,
      toast: '',
      announcement: ''
    };
  },

  computed: {
    isSignatureValid() {
      return !!(this.formData.name && this.formData.email);
    },

    photoSrc() {
      const url = safeUrl(this.formData.photoUrl);
      return url || this.uploadedPhoto || '';
    },

    sigData() {
      return this.buildData(this.formData, this.photoSrc);
    },

    sampleData() {
      return this.buildData({
        name: 'Alex Example', title: 'Product Designer', company: 'Example Studio',
        email: 'alex@example.com', phone: '+1 (555) 010-1234', website: 'https://example.com',
        address: '', department: '', pronouns: 'They/Them', timezone: '', officeHours: '',
        secondaryEmail: '', calendarLink: '',
        social: { linkedin: 'https://linkedin.com/in/alex', twitter: '', github: 'https://github.com/alex' },
        primaryColor: this.formData.primaryColor,
        textColor: this.formData.textColor
      }, '');
    },

    generatedSignature() {
      if (!this.isSignatureValid || !this.selectedTemplate) return '';
      return this.renderTemplate(this.selectedTemplate.id, this.sigData);
    },

    previewSignature() {
      const tpl = this.selectedTemplate ? this.selectedTemplate.id : 'classic';
      return this.isSignatureValid
        ? this.generatedSignature
        : this.renderTemplate(tpl, this.sampleData);
    },

    shownSocials() {
      return this.socialLinks.filter(s => this.visibleSocials.includes(s.id));
    },
    hiddenSocials() {
      return this.socialLinks.filter(s => !this.visibleSocials.includes(s.id));
    },

    activeSocialLinks() {
      return Object.entries(this.formData.social)
        .filter(([, value]) => value && value.trim() !== '')
        .map(([key, value]) => ({
          platform: key,
          url: value,
          icon: (this.socialLinks.find(s => s.id === key) || {}).icon || '🔗'
        }));
    }
  },

  mounted() {
    // Premium status must be known BEFORE restoring saved data, or a
    // premium user's saved premium template gets rejected and then
    // overwritten to 'classic' by the autosave watcher.
    this.checkPremiumAccess();

    // Premium unlock via Stripe Payment Link redirect token
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    if (accessToken && this.validateAccessToken(accessToken)) {
      this.grantPremiumAccess();
      window.history.replaceState({}, document.title, window.location.pathname);
      this.showToast('Premium unlocked, enjoy all the templates!');
    }

    this.loadSavedData();

    // Auto-open collapsed sections that already hold data
    this.openMore = !!(this.formData.phone || this.formData.website || this.formData.address);
    this.openExtras = !!(this.formData.pronouns || this.formData.department ||
      this.formData.calendarLink || this.formData.officeHours ||
      this.formData.timezone || this.formData.secondaryEmail);

    // Show social fields that already hold data
    Object.entries(this.formData.social).forEach(([id, v]) => {
      if (v && !this.visibleSocials.includes(id)) this.visibleSocials.push(id);
    });

    // Remember the user's email client tab
    try {
      const tab = localStorage.getItem('emailSigSetupTab');
      if (tab && this.setupClients.some(c => c.id === tab)) this.setupTab = tab;
      else if (/Mac|iPhone|iPad/.test(navigator.platform || '')) this.setupTab = 'apple';
    } catch (e) { /* fine */ }
  },

  watch: {
    formData: { handler() { this.saveData(); }, deep: true },
    uploadedPhoto() { this.saveData(); }
  },

  methods: {
    // ---------- data shaping ----------
    buildData(f, photo) {
      return {
        name: esc(f.name), pronouns: esc(f.pronouns), title: esc(f.title),
        company: esc(f.company), department: esc(f.department),
        email: esc(f.email), emailHref: 'mailto:' + esc(f.email),
        secondaryEmail: esc(f.secondaryEmail),
        phone: esc(f.phone), address: esc(f.address),
        website: esc(f.website), websiteHref: esc(safeUrl(f.website)),
        calendarHref: esc(safeUrl(f.calendarLink)),
        hours: esc([f.officeHours, f.timezone].filter(Boolean).join(' · ')),
        photo,
        primary: /^#[0-9a-f]{3,8}$/i.test(f.primaryColor) ? f.primaryColor : '#96603c',
        text: /^#[0-9a-f]{3,8}$/i.test(f.textColor) ? f.textColor : '#1f2937',
        socials: Object.entries(f.social || {})
          .filter(([, v]) => v && String(v).trim() !== '')
          .map(([key, value]) => ({
            url: value,
            icon: (this.socialLinks.find(s => s.id === key) || {}).icon || '🔗'
          }))
      };
    },

    renderTemplate(id, d) {
      switch (id) {
        case 'modern': return this.tplModern(d);
        case 'corporate': return this.tplCorporate(d);
        case 'creative': return this.tplCreative(d);
        case 'elegant': return this.tplElegant(d);
        case 'tech': return this.tplTech(d);
        default: return this.tplClassic(d);
      }
    },

    // ---------- the six templates (email-client-safe) ----------
    contactRows(d, fam, color, linkColor, size) {
      const rows = [];
      const push = (html) => rows.push({ style: td(fam, size || 13, color, 'padding-bottom:4px;'), html });
      if (d.email) push(`<a href="${d.emailHref}" style="${td(fam, size || 13, linkColor)}text-decoration:none;">${d.email}</a>`);
      if (d.secondaryEmail) push(`<a href="mailto:${d.secondaryEmail}" style="${td(fam, size || 13, linkColor)}text-decoration:none;">${d.secondaryEmail}</a>`);
      if (d.phone) push(d.phone);
      if (d.website) push(`<a href="${d.websiteHref}" style="${td(fam, size || 13, linkColor)}text-decoration:none;">${d.website}</a>`);
      if (d.calendarHref) push(`<a href="${d.calendarHref}" style="${td(fam, size || 13, linkColor)}text-decoration:none;">Book a meeting</a>`);
      if (d.address) push(d.address);
      if (d.hours) rows.push({ style: td(fam, 12, '#6b7280', 'padding-bottom:4px;'), html: d.hours });
      return rows;
    },

    tplClassic(d) {
      const fam = FONTS.arial;
      const photoCell = d.photo
        ? `<td style="vertical-align:top;padding-right:16px;">${photoImg(d.photo, 80, true)}</td>`
        : '';
      return `<table cellpadding="0" cellspacing="0" border="0"><tr>${photoCell}<td style="vertical-align:top;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td style="${td(fam, 18, d.text, 'font-weight:bold;padding-bottom:2px;')}">${d.name}${d.pronouns ? ` <span style="${td(fam, 13, '#6b7280')}font-weight:normal;">(${d.pronouns})</span>` : ''}</td></tr>
          ${d.title ? `<tr><td style="${td(fam, 14, '#6b7280', 'padding-bottom:2px;')}">${d.title}</td></tr>` : ''}
          ${d.company ? `<tr><td style="${td(fam, 14, d.primary, 'font-weight:bold;padding-bottom:8px;')}">${d.company}${d.department ? ` · ${d.department}` : ''}</td></tr>` : ''}
          <tr><td style="padding-bottom:8px;">${rowsTable(this.contactRows(d, fam, '#4b5563', d.primary))}</td></tr>
          ${d.socials.length ? `<tr><td>${socialTable(d.socials, fam, d.primary)}</td></tr>` : ''}
        </table>
      </td></tr></table>`;
    },

    tplModern(d) {
      const fam = FONTS.segoe;
      return `<table cellpadding="0" cellspacing="0" border="0"><tr><td>
        ${d.photo ? `<table cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-bottom:10px;">${photoImg(d.photo, 88, false)}</td></tr></table>` : ''}
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td style="${td(fam, 20, d.text, 'font-weight:bold;padding-bottom:2px;')}">${d.name}${d.pronouns ? ` <span style="${td(fam, 13, '#6b7280')}font-weight:normal;">(${d.pronouns})</span>` : ''}</td></tr>
          ${d.title ? `<tr><td style="${td(fam, 14, '#6b7280', 'padding-bottom:2px;')}">${d.title}</td></tr>` : ''}
          ${d.company ? `<tr><td style="${td(fam, 14, '#9ca3af', 'padding-bottom:10px;')}">${d.company}${d.department ? ` • ${d.department}` : ''}</td></tr>` : ''}
          <tr><td style="border-top:2px solid ${d.primary};font-size:1px;line-height:1px;padding-bottom:10px;">&nbsp;</td></tr>
          <tr><td style="padding-bottom:8px;">${rowsTable(this.contactRows(d, fam, '#4b5563', d.primary, 14))}</td></tr>
          ${d.socials.length ? `<tr><td>${socialTable(d.socials, fam, d.primary)}</td></tr>` : ''}
        </table>
      </td></tr></table>`;
    },

    tplCorporate(d) {
      const fam = FONTS.times;
      const label = (t) => `<td style="${td(fam, 13, '#6b7280', 'padding:2px 8px 2px 0;vertical-align:top;')}">${t}</td>`;
      const value = (h) => `<td style="${td(fam, 13, d.text, 'padding:2px 0;')}">${h}</td>`;
      const rows = [];
      if (d.email) rows.push(`<tr>${label('E:')}${value(`<a href="${d.emailHref}" style="${td(fam, 13, d.text)}text-decoration:none;">${d.email}</a>`)}</tr>`);
      if (d.secondaryEmail) rows.push(`<tr>${label('E2:')}${value(`<a href="mailto:${d.secondaryEmail}" style="${td(fam, 13, d.text)}text-decoration:none;">${d.secondaryEmail}</a>`)}</tr>`);
      if (d.phone) rows.push(`<tr>${label('P:')}${value(d.phone)}</tr>`);
      if (d.website) rows.push(`<tr>${label('W:')}${value(`<a href="${d.websiteHref}" style="${td(fam, 13, d.text)}text-decoration:none;">${d.website}</a>`)}</tr>`);
      if (d.calendarHref) rows.push(`<tr>${label('C:')}${value(`<a href="${d.calendarHref}" style="${td(fam, 13, d.text)}text-decoration:none;">Schedule a meeting</a>`)}</tr>`);
      if (d.address) rows.push(`<tr>${label('A:')}${value(d.address)}</tr>`);
      if (d.hours) rows.push(`<tr>${label('H:')}${value(`<span style="${td(fam, 12, '#6b7280')}">${d.hours}</span>`)}</tr>`);

      return `<table cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="4" bgcolor="${d.primary}" style="width:4px;background-color:${d.primary};font-size:1px;line-height:1px;">&nbsp;</td>
        <td width="16" style="width:16px;font-size:1px;">&nbsp;</td>
        ${d.photo ? `<td style="vertical-align:top;padding-right:16px;">${photoImg(d.photo, 88, false)}</td>` : ''}
        <td style="vertical-align:top;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr><td style="${td(fam, 19, d.text, 'font-weight:bold;letter-spacing:0.5px;padding-bottom:2px;')}">${d.name}${d.pronouns ? ` <span style="${td(fam, 12, '#6b7280')}font-weight:normal;">(${d.pronouns})</span>` : ''}</td></tr>
            ${d.title ? `<tr><td style="${td(fam, 13, '#6b7280', 'font-style:italic;padding-bottom:2px;')}">${d.title}</td></tr>` : ''}
            ${d.company ? `<tr><td style="${td(fam, 14, d.primary, 'font-weight:bold;padding-bottom:8px;')}">${d.company}${d.department ? ` | ${d.department}` : ''}</td></tr>` : ''}
            <tr><td>${rows.length ? `<table cellpadding="0" cellspacing="0" border="0">${rows.join('')}</table>` : ''}</td></tr>
            ${d.socials.length ? `<tr><td style="padding-top:10px;">${socialTable(d.socials, fam, d.text)}</td></tr>` : ''}
          </table>
        </td>
      </tr></table>`;
    },

    tplCreative(d) {
      const fam = FONTS.arial;
      return `<table cellpadding="0" cellspacing="0" border="0" bgcolor="#fef3c7"><tr>
        <td style="padding:22px;background-color:#fef3c7;">
          <table cellpadding="0" cellspacing="0" border="0" align="center" style="text-align:center;">
            ${d.photo ? `<tr><td align="center" style="padding-bottom:12px;">${photoImg(d.photo, 92, true, `border:4px solid ${d.primary};`)}</td></tr>` : ''}
            <tr><td align="center" style="${td(fam, 23, d.primary, 'font-weight:bold;padding-bottom:3px;')}">${d.name}</td></tr>
            ${d.title ? `<tr><td align="center" style="${td(fam, 14, '#6b7280', 'font-weight:bold;padding-bottom:2px;')}">${d.title}</td></tr>` : ''}
            ${d.company ? `<tr><td align="center" style="${td(fam, 15, d.text, 'font-weight:bold;padding-bottom:12px;')}">${d.company}</td></tr>` : ''}
            <tr><td>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#ffffff" style="border:1px solid #e5e7eb;">
                <tr><td style="padding:14px;">${rowsTable(this.contactRows(d, fam, '#4b5563', d.primary, 14))}</td></tr>
              </table>
            </td></tr>
            ${d.socials.length ? `<tr><td align="center" style="padding-top:12px;">${socialTable(d.socials, fam, '#ffffff', d.primary, '#ffffff')}</td></tr>` : ''}
          </table>
        </td>
      </tr></table>`;
    },

    tplElegant(d) {
      const fam = FONTS.georgia;
      const photoCell = d.photo
        ? `<td style="vertical-align:middle;padding-right:20px;">${photoImg(d.photo, 80, true, 'border:2px solid #d1d5db;')}</td>`
        : '';
      return `<table cellpadding="0" cellspacing="0" border="0" width="500" style="width:500px;max-width:500px;"><tr>${photoCell}<td style="vertical-align:middle;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td style="${td(fam, 21, d.text, 'padding-bottom:3px;')}">${d.name}</td></tr>
          ${d.title ? `<tr><td style="${td(fam, 12, '#9ca3af', 'font-style:italic;letter-spacing:1px;text-transform:uppercase;padding-bottom:2px;')}">${d.title}</td></tr>` : ''}
          ${d.company ? `<tr><td style="${td(fam, 14, '#6b7280', 'padding-bottom:10px;')}">${d.company}</td></tr>` : ''}
          <tr><td style="border-top:1px solid #e5e7eb;font-size:1px;line-height:1px;padding-bottom:10px;">&nbsp;</td></tr>
          <tr><td>${rowsTable(this.contactRows(d, fam, '#4b5563', '#6b7280'))}</td></tr>
          ${d.socials.length ? `<tr><td style="padding-top:10px;">${socialTable(d.socials, fam, '#6b7280')}</td></tr>` : ''}
        </table>
      </td></tr></table>`;
    },

    tplTech(d) {
      const fam = FONTS.mono;
      const line = (k, v) => `<tr><td style="${td(fam, 13, '#d1d5db', 'padding-bottom:5px;')}"><span style="${td(fam, 13, '#22c55e')}">${k}:</span> ${v}</td></tr>`;
      const rows = [];
      if (d.email) rows.push(line('email', `<a href="${d.emailHref}" style="${td(fam, 13, '#60a5fa')}text-decoration:none;">"${d.email}"</a>`));
      if (d.phone) rows.push(line('phone', `"${d.phone}"`));
      if (d.website) rows.push(line('web', `<a href="${d.websiteHref}" style="${td(fam, 13, '#60a5fa')}text-decoration:none;">"${d.website}"</a>`));
      if (d.calendarHref) rows.push(line('meet', `<a href="${d.calendarHref}" style="${td(fam, 13, '#60a5fa')}text-decoration:none;">"book a slot"</a>`));

      return `<table cellpadding="0" cellspacing="0" border="0" bgcolor="#1f2937"><tr>
        <td width="4" bgcolor="#22c55e" style="width:4px;background-color:#22c55e;font-size:1px;line-height:1px;">&nbsp;</td>
        <td style="padding:18px;background-color:#1f2937;">
          <table cellpadding="0" cellspacing="0" border="0">
            ${d.photo ? `<tr><td style="padding-bottom:10px;">${photoImg(d.photo, 64, false, 'border:2px solid #22c55e;')}</td></tr>` : ''}
            <tr><td style="${td(fam, 17, '#22c55e', 'font-weight:bold;letter-spacing:1px;padding-bottom:3px;')}">$ ${d.name}</td></tr>
            ${d.title ? `<tr><td style="${td(fam, 13, '#9ca3af', 'padding-bottom:2px;')}">// ${d.title}</td></tr>` : ''}
            ${d.company ? `<tr><td style="${td(fam, 13, '#60a5fa', 'padding-bottom:10px;')}">@ ${d.company}</td></tr>` : ''}
            <tr><td>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#111827" style="border:1px solid #374151;">
                <tr><td style="padding:12px;background-color:#111827;"><table cellpadding="0" cellspacing="0" border="0">${rows.join('')}</table></td></tr>
              </table>
            </td></tr>
            ${d.socials.length ? `<tr><td style="padding-top:10px;">${socialTable(d.socials, fam, '#22c55e', '#111827', '#22c55e')}</td></tr>` : ''}
          </table>
        </td>
      </tr></table>`;
    },

    // ---------- template picker ----------
    selectTemplate(template) {
      if (template.premium && !this.hasPremiumAccess) {
        this.showToast(template.name + ' is a premium template, unlock all six for $5.');
        return;
      }
      this.selectedTemplate = template;
      this.saveData();
    },

    // ---------- social pills ----------
    showSocial(id) {
      if (!this.visibleSocials.includes(id)) this.visibleSocials.push(id);
      this.$nextTick(() => {
        const el = document.getElementById('social-' + id);
        if (el) el.focus();
      });
    },
    hideSocial(id) {
      this.visibleSocials = this.visibleSocials.filter(s => s !== id);
      this.formData.social[id] = '';
    },

    // ---------- photo ----------
    handlePhotoSelect(e) {
      const file = e.target.files[0];
      if (file) this.loadPhoto(file);
    },
    handlePhotoDrop(e) {
      this.isPhotoUploading = false;
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) this.loadPhoto(file);
    },
    loadPhoto(file) {
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Photo must be under 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Center-crop square + downscale to 200px so the embedded
          // data URI stays small (Gmail truncates huge signatures).
          try {
            const S = 200;
            const canvas = document.createElement('canvas');
            canvas.width = S; canvas.height = S;
            const ctx = canvas.getContext('2d');
            const side = Math.min(img.naturalWidth, img.naturalHeight);
            const sx = (img.naturalWidth - side) / 2;
            const sy = (img.naturalHeight - side) / 2;
            ctx.drawImage(img, sx, sy, side, side, 0, 0, S, S);
            this.uploadedPhoto = canvas.toDataURL('image/jpeg', 0.85);
          } catch (err) {
            this.uploadedPhoto = e.target.result;
          }
        };
        img.onerror = () => this.showToast('Could not read that image');
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    removePhoto() {
      this.uploadedPhoto = null;
      if (this.$refs.photoInput) this.$refs.photoInput.value = '';
    },

    // ---------- copy / download ----------
    plainTextVersion() {
      // Built from the data, not DOM extraction, innerText on a detached
      // element collapses to textContent and fuses lines together.
      const f = this.formData;
      return [
        f.name + (f.pronouns ? ' (' + f.pronouns + ')' : ''),
        f.title,
        f.company + (f.department ? ' · ' + f.department : ''),
        f.email,
        f.secondaryEmail,
        f.phone,
        f.website,
        f.calendarLink,
        f.address,
        [f.officeHours, f.timezone].filter(Boolean).join(' · ')
      ].filter(s => s && String(s).trim()).join('\n');
    },

    async copySignature() {
      if (!this.isSignatureValid) return;
      const html = this.generatedSignature;
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          // Race the write against a timeout: if a permission prompt is
          // suspended or blocked by policy, fall back instead of hanging
          // with zero feedback.
          await Promise.race([
            navigator.clipboard.write([
              new ClipboardItem({
                'text/html': new Blob([html], { type: 'text/html' }),
                'text/plain': new Blob([this.plainTextVersion()], { type: 'text/plain' })
              })
            ]),
            new Promise((resolve, reject) =>
              setTimeout(() => reject(new Error('clipboard-timeout')), 1500))
          ]);
        } else {
          this.fallbackCopy(html);
        }
        this.copied = true;
        this.announcement = 'Signature copied. Paste it into your email settings.';
        this.showToast('Signature copied, now paste it into your email settings');
        clearTimeout(this._copyTimer);
        this._copyTimer = setTimeout(() => { this.copied = false; this.announcement = ''; }, 2500);
      } catch (err) {
        try {
          this.fallbackCopy(html);
          this.copied = true;
          this.showToast('Signature copied, now paste it into your email settings');
          clearTimeout(this._copyTimer);
          this._copyTimer = setTimeout(() => { this.copied = false; }, 2500);
        } catch (err2) {
          this.announcement = 'Copy failed. Try the Copy HTML code button instead.';
          this.showToast('Copy failed, try "Copy HTML code" instead');
        }
      }
    },

    fallbackCopy(html) {
      const temp = document.createElement('div');
      // Off-screen but selectable (display:none breaks selection copy)
      temp.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
      temp.innerHTML = html;
      document.body.appendChild(temp);
      const range = document.createRange();
      range.selectNode(temp);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const ok = document.execCommand('copy');
      sel.removeAllRanges();
      document.body.removeChild(temp);
      if (!ok) throw new Error('execCommand copy failed');
    },

    async copyHtmlCode() {
      if (!this.isSignatureValid) return;
      try {
        await navigator.clipboard.writeText(this.generatedSignature);
        this.showToast('HTML code copied');
        this.announcement = 'Raw HTML code copied to clipboard.';
      } catch (e) {
        this.showToast('Could not copy, your browser blocked it');
      }
    },

    downloadHtml() {
      if (!this.isSignatureValid) return;
      const doc = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + this.generatedSignature + '</body></html>';
      const blob = new Blob([doc], { type: 'text/html' });
      const link = document.createElement('a');
      link.download = 'email-signature.html';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      this.showToast('Signature downloaded as email-signature.html');
    },

    // ---------- setup tabs ----------
    setSetupTab(id) {
      this.setupTab = id;
      try { localStorage.setItem('emailSigSetupTab', id); } catch (e) { /* fine */ }
    },

    // ---------- example ----------
    loadExample() {
      this.formData.name = 'Alex Example';
      this.formData.title = 'Product Designer';
      this.formData.company = 'Example Studio';
      this.formData.email = 'alex@example.com';
      this.formData.phone = '+1 (555) 010-1234';
      this.formData.website = 'https://example.com';
      this.formData.pronouns = 'They/Them';
      this.formData.social.linkedin = 'https://linkedin.com/in/alexexample';
      this.formData.social.github = 'https://github.com/alexexample';
      this.openMore = true;
      this.showToast('Example loaded, swap in your own details before copying!');
      this.announcement = 'Example data loaded into the form.';
    },

    // ---------- toast ----------
    showToast(msg) {
      this.toast = msg;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { this.toast = ''; }, 4000);
    },

    // ---------- premium (Stripe Payment Link + token unlock) ----------
    checkPremiumAccess() {
      try {
        this.hasPremiumAccess = localStorage.getItem('emailSigPremium') === 'true';
      } catch (e) { this.hasPremiumAccess = false; }
    },
    validateAccessToken(token) {
      const validTokens = [
        'sig_premium_a8f3k9m2x7v4',
        'esp_2024_9k3m8x2v7f4a',
        'premium_unlock_7v4m2x8k3f9a'
      ];
      return validTokens.includes(token);
    },
    initializeStripePayment() {
      this.isProcessingPayment = true;
      window.location.href = 'https://payments.coffeeandfun.com/b/5kQ14o7Xo3OZ8QCeCH1RC0D';
    },
    grantPremiumAccess() {
      try { localStorage.setItem('emailSigPremium', 'true'); } catch (e) { /* fine */ }
      this.hasPremiumAccess = true;
    },

    // ---------- persistence ----------
    saveData() {
      try {
        localStorage.setItem('emailSigData', JSON.stringify({
          formData: this.formData,
          uploadedPhoto: this.uploadedPhoto,
          selectedTemplate: this.selectedTemplate ? this.selectedTemplate.id : 'classic',
          visibleSocials: this.visibleSocials
        }));
      } catch (e) {
        try {
          localStorage.setItem('emailSigData', JSON.stringify({
            formData: this.formData,
            uploadedPhoto: null,
            selectedTemplate: this.selectedTemplate ? this.selectedTemplate.id : 'classic',
            visibleSocials: this.visibleSocials
          }));
        } catch (e2) { /* storage unavailable */ }
      }
    },

    loadSavedData() {
      try {
        const savedData = localStorage.getItem('emailSigData');
        if (!savedData) return;
        const parsed = JSON.parse(savedData);
        // Saves from the old version could contain its untouched
        // "John Doe" demo pre-fill, don't resurrect fake data.
        if (parsed.formData &&
            parsed.formData.name === 'John Doe' &&
            parsed.formData.email === 'john@coffeeandfun.com') {
          return;
        }
        if (parsed.formData) {
          this.formData = {
            ...this.formData,
            ...parsed.formData,
            social: { ...this.formData.social, ...(parsed.formData.social || {}) }
          };
        }
        if (parsed.uploadedPhoto) this.uploadedPhoto = parsed.uploadedPhoto;
        if (parsed.selectedTemplate) {
          const template = this.templates.find(t => t.id === parsed.selectedTemplate);
          if (template && (!template.premium || this.hasPremiumAccess)) this.selectedTemplate = template;
        }
        if (Array.isArray(parsed.visibleSocials) && parsed.visibleSocials.length) {
          this.visibleSocials = parsed.visibleSocials;
        }
      } catch (e) { /* corrupt save, ignore */ }
    },

    clearAllData() {
      if (!confirm('Start over? This clears everything you have entered.')) return;
      try { localStorage.removeItem('emailSigData'); } catch (e) { /* fine */ }
      this.formData = {
        name: '', title: '', company: '', email: '',
        phone: '', website: '', address: '',
        department: '', pronouns: '', timezone: '', officeHours: '',
        secondaryEmail: '', calendarLink: '', photoUrl: '',
        social: {
          linkedin: '', twitter: '', github: '', instagram: '', facebook: '',
          youtube: '', tiktok: '', medium: '', dribbble: '', whatsapp: '', telegram: ''
        },
        primaryColor: '#96603c',
        textColor: '#1f2937'
      };
      this.uploadedPhoto = null;
      this.selectedTemplate = this.templates[0];
      this.visibleSocials = ['linkedin', 'twitter', 'github'];
      this.openMore = false;
      this.openExtras = false;
      if (this.$refs.photoInput) this.$refs.photoInput.value = '';
      this.showToast('Cleared, fresh start!');
      this.announcement = 'All fields cleared.';
    }
  }
}).mount('#main-content');

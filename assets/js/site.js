(() => {
    "use strict";

    // --- Constants ---
    const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";
    const SUPPORT_EMAIL = "support@patrol-connect.com";
    const NORMAL_CHALLENGE_WIDTH = 300;
    const EMAIL_PATTERN = /^(?!\.)(?!.*\.\.)(?!.*\.@)[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const SEATS_PATTERN = /^[1-9]\d*$/;
    const DRAFT_KEY = "pc.contact.draft";
    const DRAFT_FIELDS = ["topic", "name", "email", "phone", "agency", "role", "seats", "facility", "message"];
    const RESULTS = {
        success: { tone: "success", text: "Your message was sent. We reply by email to the address you gave." },
        invalid: { tone: "danger", text: "Could not send your message. Check each field and send it again." },
        security: { tone: "danger", text: "Could not send your message. Complete the security check again, then send it." },
        failed: { tone: "danger", text: "Something went wrong on our end. Try again in a moment.", mail: true },
        ratelimited: { tone: "warning", text: "Too many messages were sent from this connection. Try again in about 10 minutes." }
    };

    const form = document.getElementById("contact-form");
    const topicSelect = document.getElementById("f-topic");
    const topicNote = document.getElementById("topic-note");
    const topicNext = document.getElementById("topic-next");
    const banner = document.getElementById("contact-result");
    const challengeSlot = document.getElementById("contact-challenge");
    const challengeError = document.getElementById("contact-challenge-error");
    const submitButton = document.getElementById("contact-submit");
    const submitLabel = submitButton.textContent;
    let widgetId = null;

    // --- Navigation ---
    const menu = document.getElementById("site-menu");
    const sectionLinks = new Map(
        [...menu.querySelectorAll(".site-nav__links a")].map((link) => [link.hash.slice(1), link])
    );

    const closeMenu = () => {
        if (typeof menu.hidePopover === "function" && menu.matches(":popover-open")) menu.hidePopover();
    };

    menu.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeMenu();
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", closeMenu);

    const sectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            const link = sectionLinks.get(entry.target.id);
            if (entry.isIntersecting) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
        }
    }, { rootMargin: "-50% 0px -50% 0px" });
    for (const id of sectionLinks.keys()) sectionObserver.observe(document.getElementById(id));

    // --- Field errors ---
    const showError = (input, message) => {
        const error = document.getElementById(`${input.id}-error`);
        error.textContent = message;
        error.hidden = false;
        input.setAttribute("aria-invalid", "true");
    };

    const clearError = (input) => {
        const error = document.getElementById(`${input.id}-error`);
        if (!error) return;
        error.textContent = "";
        error.hidden = true;
        input.removeAttribute("aria-invalid");
    };

    const fieldMessage = (input) => {
        const value = input.value.trim();
        switch (input.name) {
            case "name":
                return value === "" ? "Enter your full name." : "";
            case "email":
                return EMAIL_PATTERN.test(value) && input.checkValidity() ? "" : "Enter a valid email address.";
            case "seats":
                return input.checkValidity() && (value === "" || SEATS_PATTERN.test(value)) ? "" :"Enter a whole number from 1 to 5000, or leave it empty.";
            case "message":
                return value === "" ? "Enter a message." : "";
            default:
                return "";
        }
    };

    // --- Topic ---
    const applyTopic = () => {
        const topic = topicSelect.value;
        const option = topicSelect.options[topicSelect.selectedIndex];
        for (const field of form.querySelectorAll("[data-topics]")) {
            const shown = field.dataset.topics.split(" ").includes(topic);
            field.hidden = !shown;
            for (const control of field.querySelectorAll("input")) {
                control.disabled = !shown;
                if (!shown) clearError(control);
            }
        }
        topicNext.textContent = option.dataset.next;
        topicNote.textContent = option.dataset.note || "";
        topicNote.hidden = !option.dataset.note;
    };

    topicSelect.addEventListener("change", applyTopic);
    for (const link of document.querySelectorAll("[data-topic-link]")) {
        link.addEventListener("click", () => {
            topicSelect.value = link.dataset.topicLink;
            applyTopic();
        });
    }
    applyTopic();

    // --- Security check ---
    window.onTurnstileLoad = () => {
        const compact = challengeSlot.clientWidth < NORMAL_CHALLENGE_WIDTH;
        challengeSlot.classList.toggle("is-compact", compact);
        widgetId = window.turnstile.render(challengeSlot, {
            sitekey: challengeSlot.dataset.sitekey,
            theme: "dark",
            size: compact ? "compact" : "normal",
            callback: () => {
                challengeError.hidden = true;
            }
        });
    };

    const turnstileScript = document.createElement("script");
    turnstileScript.src = TURNSTILE_SCRIPT;
    turnstileScript.async = true;
    document.head.append(turnstileScript);

    const challengeMessage = () => {
        if (widgetId === null) return "The security check has not loaded yet. Try again in a moment, or email support@patrol-connect.com.";
        const token = form.elements["cf-turnstile-response"];
        return token && token.value !== "" ? "" : "Complete the security check, then send your message.";
    };

    // --- Draft ---
    const saveDraft = () => {
        const draft = Object.fromEntries(DRAFT_FIELDS.map((name) => [name, form.elements[name].value]));
        try {
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch {
            return;
        }
    };

    const takeDraft = () => {
        try {
            const saved = sessionStorage.getItem(DRAFT_KEY);
            sessionStorage.removeItem(DRAFT_KEY);
            return saved === null ? null : JSON.parse(saved);
        } catch {
            return null;
        }
    };

    const restoreDraft = (draft) => {
        for (const name of DRAFT_FIELDS) {
            if (typeof draft[name] === "string") form.elements[name].value = draft[name];
        }
        applyTopic();
    };

    // --- Submit ---
    for (const input of form.querySelectorAll(".input")) {
        input.addEventListener("input", () => clearError(input));
    }

    form.addEventListener("submit", (event) => {
        let firstInvalid = null;
        for (const input of form.querySelectorAll("input.input, textarea.input")) {
            if (input.disabled) continue;
            const message = fieldMessage(input);
            if (message === "") {
                clearError(input);
                continue;
            }
            showError(input, message);
            firstInvalid = firstInvalid || input;
        }
        const challenge = challengeMessage();
        challengeError.textContent = challenge;
        challengeError.hidden = challenge === "";

        if (firstInvalid || challenge !== "") {
            event.preventDefault();
            if (firstInvalid) firstInvalid.focus();
            else challengeSlot.scrollIntoView({ block: "center" });
            return;
        }
        saveDraft();
        submitButton.disabled = true;
        submitButton.textContent = "Sending…";
    });

    window.addEventListener("pageshow", (event) => {
        if (!event.persisted) return;
        submitButton.disabled = false;
        submitButton.textContent = submitLabel;
        if (widgetId !== null) window.turnstile.reset(widgetId);
    });

    // --- Result banner ---
    const draft = takeDraft();
    const result = new URLSearchParams(window.location.search).get("contact");
    if (result !== null) {
        const outcome = Object.hasOwn(RESULTS, result) ? RESULTS[result] : null;
        if (outcome) {
            if (result !== "success" && draft !== null) restoreDraft(draft);
            banner.textContent = outcome.text;
            if (outcome.mail) {
                const link = document.createElement("a");
                link.href = `mailto:${SUPPORT_EMAIL}`;
                link.textContent = SUPPORT_EMAIL;
                banner.append(" You can also email ", link, ".");
            }
            banner.classList.add(`banner--${outcome.tone}`);
            banner.hidden = false;
            banner.focus();
        }
        window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
})();

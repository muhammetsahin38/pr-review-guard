(async function () {

    function getApproveButton() {
        const btn = [...document.querySelectorAll('button.bolt-button')]
            .find(b =>
                b.querySelector('.bolt-button-text')?.innerText.trim() === 'Approve'
            );
        return btn;
    }
	
	function getPrIsteButton() {
		return [...document.querySelectorAll('button.bolt-button')]
			.find(b => {
				const text = b.querySelector('.bolt-button-text')?.innerText || '';
				return text.toLocaleLowerCase('tr-TR').includes('pr iste');
			}) || null;
	}
	
	function placeCounter(counter, approveButton) {
		const prIsteButton = getPrIsteButton();

		if (prIsteButton && prIsteButton.parentElement) {
			prIsteButton.parentElement.appendChild(counter);
			counter.style.marginLeft = "8px";
			return;
		}
		
		if (approveButton && approveButton.parentElement) {
			approveButton.parentElement.appendChild(counter);
			counter.style.marginLeft = "8px";
		}
	}
	
	function getApproveDropdownButton(approveButton) {
		if (!approveButton) return null;

		const container = approveButton.parentElement;
		if (!container) return null;

		return container.querySelector(
			'button.bolt-split-button-option'
		);
	}

	function getMoreActionsButton() {
		return document.querySelector(
			'button.bolt-split-button-option[aria-label="More actions"]'
		);
	}
	
	function getPullRequestCreatedDate() {
		const times = [
			...document.querySelectorAll('time.activity-card-time[datetime]')
		];

		if (!times.length) return null;

		const dates = times
			.map(t => new Date(t.getAttribute('datetime')))
			.filter(d => !isNaN(d.getTime()));

		if (!dates.length) return null;

		return new Date(Math.min(...dates.map(d => d.getTime())));
	}

    function waitForApproveButton() {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                const btn = getApproveButton();
                if (btn) {
                    clearInterval(interval);
                    resolve(btn);
                }
            }, 500);
        });
    }

    function getPrId() {
        const match = location.href.match(/pullrequest\/(\d+)/);
        return match ? match[1] : "unknown";
    }
	
	function createCounterElement() {
		const el = document.createElement("span");
		el.className = "pr-timer";
		return el;
	}
	
	function setButtonDisabled(btn, disabled) {
		if (!btn) return;

		// İlk kez görürsek, eski class listesini sakla
		if (!btn.dataset.prGuardOriginalClass) {
			btn.dataset.prGuardOriginalClass = btn.className;
		}

		if (disabled) {
			btn.disabled = true;
			btn.classList.add("ado-pr-disabled");
			btn.classList.remove("primary", "enabled");
			btn.style.pointerEvents = "none";
		} else {
			btn.disabled = false;
			btn.classList.remove("ado-pr-disabled");
			btn.className = btn.dataset.prGuardOriginalClass;
			btn.style.pointerEvents = "";
		}
	}

    const approveButton = await waitForApproveButton();
    const prId = getPrId();

	chrome.storage.sync.get(["cooldownMinutes"], (cfg) => {

		const minutes = cfg.cooldownMinutes || 4;
		const durationMs = minutes * 60 * 1000;

		const createdDate = getPullRequestCreatedDate();

		// PR creation date bulunamazsa güvenli tarafta kal → kilitle
		if (!createdDate) {
			console.warn("PR creation date bulunamadı, buton kilitli kalacak");
			return;
		}

		const lockUntil = createdDate.getTime() + durationMs;

		chrome.runtime.sendMessage({
			type: "SCHEDULE_NOTIFICATION",
			alarmName: `pr_ready_${prId}`,
			triggerAt: lockUntil,
			title: "PR Onaylanabilir",
			message: "Bekleme süresi doldu. Pull Request artık onaylanabilir.",
			url: location.href
		});

		const counter = createCounterElement();

		placeCounter(counter, approveButton);
		
		const approveDropdownButton = getApproveDropdownButton(approveButton);

		const tick = () => {
			const remaining = lockUntil - Date.now();

			if (remaining <= 0) {
				setButtonDisabled(approveButton, false);
				setButtonDisabled(approveDropdownButton, false);
				counter.remove();
				clearInterval(timer);
				return;
			}

			setButtonDisabled(approveButton, true);
			setButtonDisabled(approveDropdownButton, true);

			const m = Math.floor(remaining / 60000);
			const s = Math.floor((remaining % 60000) / 1000);

			counter.textContent = `⏳ ${m}:${s.toString().padStart(2, "0")}`;
		};

		tick();
		const timer = setInterval(tick, 1000);
	});


})();

(() => {
    const MODULE_NAME = 'my_topbar_test';
    const EXTENSION_NAME = 'my-topbar-test';
    const EXTENSION_PATH = `/scripts/extensions/third-party/${EXTENSION_NAME}`;
    const GLOBAL_FLAG = '__myTopbarTestLoaded__';

    const DEFAULT_TEXT = '琳喵喵很高兴为您服务';
    const EMPTY_CHAT_TEXT = '当前聊天里还没有可读取的消息。';
    const RANGE_NOT_FOUND_TEXT = '标签内没有找到内容,无法截取';
    const RANGE_INCOMPLETE_TEXT = '请同时填写开始标签和结束标签，或者两个都留空。';
    const DEFAULT_TEMPLATES = Object.freeze([
        Object.freeze({
            id: 'tmpl_polish',
            label: '润色',
            content: '请润色下面的内容，保持原意不变：\n\n{{text}}',
        }),
        Object.freeze({
            id: 'tmpl_summary',
            label: '总结',
            content: '请总结下面的内容，并提取重点：\n\n{{text}}',
        }),
        Object.freeze({
            id: 'tmpl_points',
            label: '提取要点',
            content: '请提取下面内容的核心要点，并用分点方式输出：\n\n{{text}}',
        }),
    ]);

    const DEFAULT_SETTINGS = Object.freeze({
        keepTags: false,
        onlyReplaceInTags: false,
        startTag: '',
        endTag: '',
        templates: DEFAULT_TEMPLATES,
        selectedTemplateIds: Object.freeze([]),
        apiConfig: Object.freeze({
            temperature: '1',
            topP: '',
            topK: '',
            presencePenalty: '',
            frequencyPenalty: '',
            stream: false,
            modelSource: 'same',
            stopString: '',
            customApiBaseUrl: '',
            customApiKey: '',
            customModelName: '',
        }),
    });

    // 防止脚本被重复执行
    if (globalThis[GLOBAL_FLAG]) {
        console.warn(`[${MODULE_NAME}] 脚本已经加载过，跳过重复加载。`);
        return;
    }
    globalThis[GLOBAL_FLAG] = true;

    const context = SillyTavern.getContext();
    const eventSource = context.eventSource;
    const event_types = context.event_types;
    const extensionSettings = context.extensionSettings || (context.extensionSettings = {});
    const saveSettingsDebounced = typeof context.saveSettingsDebounced === 'function'
        ? context.saveSettingsDebounced.bind(context)
        : () => {};
    const Popup = context.Popup;

    const SELECTORS = Object.freeze({
        topBar: '#top-bar',
        anchor: '#extensionsMenuButton',
        button: '#my-topbar-test-button',
        panel: '#my-topbar-test-panel',
        closeBtn: '#my-topbar-test-close-btn', // 新增关闭按钮

        rangeToggleButton: '#my-topbar-test-range-toggle',
        rangeSettings: '#my-topbar-test-range-settings',
        captureSendToggleButton: '#my-topbar-test-capture-send-toggle',
        captureSendSettings: '#my-topbar-test-capture-send-settings',
        apiToggleButton: '#my-topbar-test-api-toggle',
        apiSettings: '#my-topbar-test-api-settings',
        autoTriggerToggleButton: '#my-topbar-test-auto-trigger-toggle',
        autoTriggerSettings: '#my-topbar-test-auto-trigger-settings',
        autoTriggerEnabledCheckbox: '#my-topbar-test-auto-trigger-enabled',
        autoTriggerStopButton: '#my-topbar-test-auto-trigger-stop',
        keepTagsCheckbox: '#my-topbar-test-keep-tags',
        onlyReplaceInTagsCheckbox: '#my-topbar-test-only-replace-in-tags',
        startTagInput: '#my-topbar-test-start-tag',
        endTagInput: '#my-topbar-test-end-tag',

        templateToggleButton: '#my-topbar-test-template-toggle',
        templateSettings: '#my-topbar-test-template-settings',
        templateBrowseView: '#my-topbar-test-template-browse-view',
        templateEditorView: '#my-topbar-test-template-editor-view',
        templateList: '#my-topbar-test-template-list',
        templateDeleteSelectedButton: '#my-topbar-test-template-delete-selected',
        templateAddButton: '#my-topbar-test-template-add',
        templateExportButton: '#my-topbar-test-template-export',
        templateImportButton: '#my-topbar-test-template-import',
        templateImportInput: '#my-topbar-test-template-import-input',
        templateEditButton: '.my-topbar-test-template-edit-button',
        templateEditorTitle: '#my-topbar-test-template-editor-title',
        templateEditorLabelInput: '#my-topbar-test-template-editor-label',
        templateEditorTextarea: '#my-topbar-test-template-editor-text',
        templateEditorSaveButton: '#my-topbar-test-template-editor-save',
        templateEditorExitButton: '#my-topbar-test-template-editor-exit',

        manualTriggerButton: '#my-topbar-test-manual-trigger',
        manualSendButton: '#my-topbar-test-manual-send',
        stopManualFlowButton: '#my-topbar-test-stop-manual-flow',
        outputTextarea: '#my-topbar-test-output',

        apiTemperatureInput: '#my-topbar-test-api-temperature',
        apiTopPInput: '#my-topbar-test-api-top-p',
        apiTopKInput: '#my-topbar-test-api-top-k',
        apiPresencePenaltyInput: '#my-topbar-test-api-presence-penalty',
        apiFrequencyPenaltyInput: '#my-topbar-test-api-frequency-penalty',
        apiStreamCheckbox: '#my-topbar-test-api-stream',
        apiStopStringInput: '#my-topbar-test-api-stop-string',
        apiModelSourceToggle: '#my-topbar-test-api-source-toggle',
        apiModelSourceBody: '#my-topbar-test-api-source-body',
        apiModelSourceCurrent: '#my-topbar-test-api-source-current',
        apiModelSourceOptions: '#my-topbar-test-api-source-options',
        apiModelSourceOptionButton: '.my-topbar-test-api-source-option',
        apiCustomConfig: '#my-topbar-test-api-custom-config',
        apiCustomBaseUrlInput: '#my-topbar-test-api-custom-base-url',
        apiCustomApiKeyInput: '#my-topbar-test-api-custom-api-key',
        apiCustomModelNameInput: '#my-topbar-test-api-custom-model-name',
        apiCustomFetchModelsButton: '#my-topbar-test-api-custom-fetch-models',
        apiCustomModelSelect: '#my-topbar-test-api-custom-model-select',

        mobileTabs: '#my-topbar-test-mobile-tabs',
        mobileTabMenu: '#my-topbar-test-mobile-tab-menu',
        mobileTabOutput: '#my-topbar-test-mobile-tab-output',
        mobileBackButton: '#my-topbar-test-mobile-back',

        replyModal: '#my-topbar-test-reply-modal',
        replyModalTextarea: '#my-topbar-test-reply-modal-text',
        replyModalConfirmButton: '#my-topbar-test-reply-modal-confirm',
        replyModalCloseButton: '#my-topbar-test-reply-modal-close',

        templateApplyButton: '.my-topbar-test-template-apply',
        templateMoveButton: '.my-topbar-test-template-move-button',
        menuBtns: '.my-topbar-test-menu-btn' // 新增菜单按钮统称
    });

    let initialized = false;
    let extractedBaseText = DEFAULT_TEXT;
    let templateEditorState = null;
    let customModelState = {
        isLoading: false,
        sourceBaseUrl: '',
        models: [],
    };
    let manualSendState = {
        isBusy: false,
        chatId: '',
        requestId: 0,
    };
    let replyModalState = {
        chatId: '',
        source: '',
    };

    let autoTriggerState = {
        enabledChatId: '',
        isBusy: false,
        requestId: 0,
        stopRequested: false,
        stoppedByUser: false,
        pendingTimerId: 0,
    };

    function log(...args) {
        console.log(`[${MODULE_NAME}]`, ...args);
    }

    function deepClone(value) {
        try {
            if (typeof structuredClone === 'function') {
                return structuredClone(value);
            }
        } catch (error) {
            console.warn(`[${MODULE_NAME}] structuredClone 不可用，改用 JSON 复制。`, error);
        }

        return JSON.parse(JSON.stringify(value));
    }

    function savePluginSettings() {
        try {
            saveSettingsDebounced();
        } catch (error) {
            console.warn(`[${MODULE_NAME}] 保存设置失败`, error);
        }
    }

    function normalizeTagName(value) {
        return String(value ?? '').replace(/[<>\s/]/g, '');
    }

    function createTemplateId(index = 0) {
        return `my_topbar_test_template_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function normalizeTemplateItem(item, index = 0) {
        return {
            id: String(item?.id ?? '').trim() || createTemplateId(index),
            label: String(item?.label ?? '').trim() || `模板${index + 1}`,
            content: String(item?.content ?? ''),
        };
    }

    function normalizeTemplateList(rawTemplates) {
        if (!Array.isArray(rawTemplates)) {
            return deepClone(DEFAULT_SETTINGS.templates);
        }

        return rawTemplates.map((item, index) => normalizeTemplateItem(item, index));
    }

    function normalizeSelectedTemplateIds(rawSelectedTemplateIds, templates) {
        if (!Array.isArray(rawSelectedTemplateIds) || !Array.isArray(templates)) {
            return [];
        }

        const validTemplateIds = new Set(templates.map(item => item.id));
        const seen = new Set();
        const selectedTemplateIds = [];

        for (const rawId of rawSelectedTemplateIds) {
            const templateId = String(rawId ?? '').trim();

            if (!templateId || !validTemplateIds.has(templateId) || seen.has(templateId)) {
                continue;
            }

            seen.add(templateId);
            selectedTemplateIds.push(templateId);
        }

        return selectedTemplateIds;
    }

    function normalizeApiConfig(rawApiConfig) {
        const source = rawApiConfig && typeof rawApiConfig === 'object' && !Array.isArray(rawApiConfig)
            ? rawApiConfig
            : {};

        const defaultApiConfig = DEFAULT_SETTINGS.apiConfig;

        return {
            temperature: String(source.temperature ?? defaultApiConfig.temperature),
            topP: String(source.topP ?? defaultApiConfig.topP),
            topK: String(source.topK ?? defaultApiConfig.topK),
            presencePenalty: String(source.presencePenalty ?? defaultApiConfig.presencePenalty),
            frequencyPenalty: String(source.frequencyPenalty ?? defaultApiConfig.frequencyPenalty),
            stream: Boolean(source.stream),
            modelSource: source.modelSource === 'custom' ? 'custom' : 'same',
            stopString: String(source.stopString ?? defaultApiConfig.stopString),
            customApiBaseUrl: String(source.customApiBaseUrl ?? defaultApiConfig.customApiBaseUrl),
            customApiKey: String(source.customApiKey ?? defaultApiConfig.customApiKey),
            customModelName: String(source.customModelName ?? defaultApiConfig.customModelName),
        };
    }

    function loadSettings() {
        let settings = extensionSettings[MODULE_NAME];

        if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
            extensionSettings[MODULE_NAME] = deepClone(DEFAULT_SETTINGS);
            settings = extensionSettings[MODULE_NAME];
            return settings;
        }

        if (typeof settings.keepTags !== 'boolean') {
            settings.keepTags = DEFAULT_SETTINGS.keepTags;
        }

        if (typeof settings.onlyReplaceInTags !== 'boolean') {
            settings.onlyReplaceInTags = DEFAULT_SETTINGS.onlyReplaceInTags;
        }

        if (typeof settings.startTag !== 'string') {
            settings.startTag = DEFAULT_SETTINGS.startTag;
        }

        if (typeof settings.endTag !== 'string') {
            settings.endTag = DEFAULT_SETTINGS.endTag;
        }

        settings.startTag = normalizeTagName(settings.startTag);
        settings.endTag = normalizeTagName(settings.endTag);
        settings.templates = normalizeTemplateList(settings.templates);
        settings.selectedTemplateIds = normalizeSelectedTemplateIds(settings.selectedTemplateIds, settings.templates);
        settings.apiConfig = normalizeApiConfig(settings.apiConfig);

        return settings;
    }

    function isAutoTriggerEnabledForCurrentChat() {
        const currentChatId = getCurrentChatIdValue();
        return Boolean(currentChatId && autoTriggerState.enabledChatId === currentChatId);
    }

    function setAutoTriggerEnabledForCurrentChat(enabled) {
        const currentChatId = getCurrentChatIdValue();

        autoTriggerState.enabledChatId = enabled ? currentChatId : '';
        autoTriggerState.requestId += 1;
        autoTriggerState.isBusy = false;
        autoTriggerState.stopRequested = false;
        autoTriggerState.stoppedByUser = false;

        if (autoTriggerState.pendingTimerId) {
            window.clearTimeout(autoTriggerState.pendingTimerId);
            autoTriggerState.pendingTimerId = 0;
        }
    }

    function showMessage(type, message) {
        try {
            if (globalThis.toastr && typeof globalThis.toastr[type] === 'function') {
                globalThis.toastr[type](message);
                return;
            }
        } catch (error) {
            console.warn(`[${MODULE_NAME}] toastr 调用失败`, error);
        }

        if (type === 'error') {
            console.error(`[${MODULE_NAME}] ${message}`);
        } else if (type === 'warning') {
            console.warn(`[${MODULE_NAME}] ${message}`);
        } else {
            console.log(`[${MODULE_NAME}] ${message}`);
        }

        if (type === 'error' || type === 'warning') {
            window.alert(message);
        }
    }

    async function askConfirmDialog(title, message) {
        try {
            if (Popup && Popup.show && typeof Popup.show.confirm === 'function') {
                const result = await Popup.show.confirm(title, message);
                return Boolean(result);
            }
        } catch (error) {
            console.warn(`[${MODULE_NAME}] Popup.confirm 调用失败，改用原生 confirm。`, error);
        }

        return window.confirm(`${title}\n\n${message}`);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getCurrentChatIdValue() {
        const latestContext = SillyTavern.getContext();

        if (latestContext && typeof latestContext.getCurrentChatId === 'function') {
            return String(latestContext.getCurrentChatId() ?? '');
        }

        return String(latestContext?.chatId ?? '');
    }

    function setButtonBusyState(selector, isBusy, busyText = '') {
        const $button = $(selector);
        if (!$button.length) {
            return;
        }

        if ($button.data('originalText') === undefined) {
            $button.data('originalText', $button.text());
        }

        $button.prop('disabled', isBusy);

        if (isBusy && busyText) {
            $button.text(busyText);
            return;
        }

        const originalText = $button.data('originalText');
        if (originalText !== undefined) {
            $button.text(originalText);
        }
    }

    function updateManualSendUiState() {
        setButtonBusyState(SELECTORS.manualSendButton, manualSendState.isBusy, '发送中...');
    }

    function setManualSendBusy(isBusy) {
        manualSendState.isBusy = isBusy;
        updateManualSendUiState();
    }

    function isAutoFlowActive() {
        const isAutoConfirmVisible = $(SELECTORS.replyModal).is(':visible')
            && String(replyModalState.source ?? '') === 'auto';

        return autoTriggerState.isBusy || Boolean(autoTriggerState.pendingTimerId) || isAutoConfirmVisible;
    }

    function getApiConfig() {
        return loadSettings().apiConfig;
    }

    function resolveApiNumber(value, defaultValue, parser = Number) {
        const normalized = String(value ?? '').trim();
        if (normalized === '') {
            return defaultValue;
        }

        const parsed = parser(normalized);
        return Number.isFinite(parsed) ? parsed : defaultValue;
    }

    function getResolvedApiConfig() {
        const apiConfig = getApiConfig();

        return {
            temperature: resolveApiNumber(apiConfig.temperature, 1),
            topP: resolveApiNumber(apiConfig.topP, 1),
            topK: resolveApiNumber(apiConfig.topK, 0, value => Number.parseInt(value, 10)),
            presencePenalty: resolveApiNumber(apiConfig.presencePenalty, 0),
            frequencyPenalty: resolveApiNumber(apiConfig.frequencyPenalty, 0),
            stream: Boolean(apiConfig.stream),
            modelSource: apiConfig.modelSource === 'custom' ? 'custom' : 'same',
            stopString: String(apiConfig.stopString ?? ''),
            customApiBaseUrl: String(apiConfig.customApiBaseUrl ?? ''),
            customApiKey: String(apiConfig.customApiKey ?? ''),
            customModelName: String(apiConfig.customModelName ?? ''),
        };
    }

    function updateApiConfigField(key, value) {
        const settings = loadSettings();
        settings.apiConfig[key] = value;
        savePluginSettings();
    }

    function updateApiConfigString(selector, key) {
        const value = String($(selector).val() ?? '');
        updateApiConfigField(key, value);
    }

    function updateApiConfigBoolean(selector, key) {
        const checked = $(selector).is(':checked');
        updateApiConfigField(key, checked);
    }

    function toggleApiSourceDrawer() {
        $(SELECTORS.apiModelSourceBody).stop(true, true).slideToggle(160);
    }

    function toggleApiSourceOptions() {
        $(SELECTORS.apiModelSourceOptions).stop(true, true).slideToggle(160);
    }

    function setApiModelSource(value) {
        const normalized = value === 'custom' ? 'custom' : 'same';
        updateApiConfigField('modelSource', normalized);
        syncApiConfigUi();
        $(SELECTORS.apiModelSourceOptions).stop(true, true).slideUp(160);
    }

    function withTemporarySettingOverride(target, key, value, restorers) {
        if (!target || typeof target !== 'object') {
            return;
        }

        const hadOwn = Object.prototype.hasOwnProperty.call(target, key);
        const previousValue = target[key];

        target[key] = value;
        restorers.push(() => {
            if (hadOwn) {
                target[key] = previousValue;
            } else {
                delete target[key];
            }
        });
    }

    function applyTemporaryGenerationOverrides(contextValue, resolvedApiConfig) {
        const restorers = [];
        const chatCompletionSettings = contextValue?.chatCompletionSettings;
        const textCompletionSettings = contextValue?.textCompletionSettings;

        withTemporarySettingOverride(chatCompletionSettings, 'temp_openai', resolvedApiConfig.temperature, restorers);
        withTemporarySettingOverride(chatCompletionSettings, 'top_p_openai', resolvedApiConfig.topP, restorers);
        withTemporarySettingOverride(chatCompletionSettings, 'top_k_openai', resolvedApiConfig.topK, restorers);
        withTemporarySettingOverride(chatCompletionSettings, 'pres_pen_openai', resolvedApiConfig.presencePenalty, restorers);
        withTemporarySettingOverride(chatCompletionSettings, 'freq_pen_openai', resolvedApiConfig.frequencyPenalty, restorers);
        withTemporarySettingOverride(chatCompletionSettings, 'stream_openai', resolvedApiConfig.stream, restorers);

        withTemporarySettingOverride(textCompletionSettings, 'temp', resolvedApiConfig.temperature, restorers);
        withTemporarySettingOverride(textCompletionSettings, 'top_p', resolvedApiConfig.topP, restorers);
        withTemporarySettingOverride(textCompletionSettings, 'top_k', resolvedApiConfig.topK, restorers);
        withTemporarySettingOverride(textCompletionSettings, 'presence_pen', resolvedApiConfig.presencePenalty, restorers);
        withTemporarySettingOverride(textCompletionSettings, 'freq_pen', resolvedApiConfig.frequencyPenalty, restorers);
        withTemporarySettingOverride(textCompletionSettings, 'streaming', resolvedApiConfig.stream, restorers);

        return () => {
            while (restorers.length > 0) {
                const restore = restorers.pop();
                restore();
            }
        };
    }

    function syncApiConfigUi() {
        syncStopStringWithEndTagIfNeeded();
        const apiConfig = getApiConfig();

        $(SELECTORS.apiTemperatureInput).val(apiConfig.temperature);
        $(SELECTORS.apiTopPInput).val(apiConfig.topP);
        $(SELECTORS.apiTopKInput).val(apiConfig.topK);
        $(SELECTORS.apiPresencePenaltyInput).val(apiConfig.presencePenalty);
        $(SELECTORS.apiFrequencyPenaltyInput).val(apiConfig.frequencyPenalty);
        $(SELECTORS.apiStreamCheckbox).prop('checked', apiConfig.stream);
        $(SELECTORS.apiStopStringInput).val(apiConfig.stopString);
        $(SELECTORS.apiModelSourceCurrent).text(apiConfig.modelSource === 'custom' ? '自定义' : '与酒馆相同');
        const nextValue = apiConfig.modelSource === 'custom' ? 'same' : 'custom';
        const nextLabel = nextValue === 'custom' ? '自定义' : '与酒馆相同';
        $(SELECTORS.apiModelSourceOptions).html(`
            <button type="button"
                    class="menu_button my-topbar-test-api-source-option"
                    data-source-value="${nextValue}">
                ${nextLabel}
            </button>
        `);

        $(SELECTORS.apiCustomBaseUrlInput).val(apiConfig.customApiBaseUrl);
        $(SELECTORS.apiCustomApiKeyInput).val(apiConfig.customApiKey);
        $(SELECTORS.apiCustomModelNameInput).val(apiConfig.customModelName);
        const isCustomSource = apiConfig.modelSource === 'custom';
        $(SELECTORS.apiCustomConfig).toggle(isCustomSource);
        syncCustomModelSelectUi();
    }

    function isMobileLayout() {
        try {
            return Boolean(window.matchMedia && window.matchMedia('(max-width: 850px)').matches);
        } catch (error) {
            return false;
        }
    }

    function setMobilePanelView(view) {
        const normalized = view === 'output' ? 'output' : (view === 'detail' ? 'detail' : 'menu');
        $(SELECTORS.panel).attr('data-mobile-view', normalized);
        syncMobileTabsUi();
    }

    function syncMobileTabsUi() {
        if (!isMobileLayout()) {
            $(SELECTORS.panel).removeAttr('data-mobile-view');
            return;
        }

        const view = String($(SELECTORS.panel).attr('data-mobile-view') ?? 'menu');
        const isOutput = view === 'output';
        const isDetail = view === 'detail';

        $(SELECTORS.mobileTabMenu)
            .toggleClass('active', !isOutput)
            .attr('aria-pressed', String(!isOutput));
        $(SELECTORS.mobileTabOutput)
            .toggleClass('active', isOutput)
            .attr('aria-pressed', String(isOutput));

        $(SELECTORS.mobileBackButton).css('display', !isOutput && isDetail ? 'inline-flex' : 'none');
    }

    function normalizeCustomApiBaseUrl(value) {
        return String(value ?? '').trim().replace(/\/+$/, '');
    }

    function joinUrl(baseUrl, path) {
        const normalizedBaseUrl = normalizeCustomApiBaseUrl(baseUrl);
        const normalizedPath = String(path ?? '').trim();

        if (!normalizedBaseUrl) {
            return '';
        }

        if (!normalizedPath) {
            return normalizedBaseUrl;
        }

        if (normalizedPath.startsWith('/')) {
            return `${normalizedBaseUrl}${normalizedPath}`;
        }

        return `${normalizedBaseUrl}/${normalizedPath}`;
    }

    function renderCustomModelSelect(modelIds, selectedValue = '') {
        const $select = $(SELECTORS.apiCustomModelSelect);
        if (!$select.length) {
            return;
        }

        if (!Array.isArray(modelIds) || modelIds.length === 0) {
            $select.prop('disabled', true);
            $select.html('<option value="">获取列表选择</option>');
            $select.val('');
            return;
        }

        const optionsHtml = modelIds
            .map(modelId => {
                const escaped = escapeHtml(modelId);
                return `<option value="${escaped}">${escaped}</option>`;
            })
            .join('');

        $select.prop('disabled', false);
        $select.html(optionsHtml);

        const normalizedSelectedValue = String(selectedValue ?? '').trim();
        if (normalizedSelectedValue && modelIds.includes(normalizedSelectedValue)) {
            $select.val(normalizedSelectedValue);
        } else {
            $select.prop('selectedIndex', 0);
        }
    }

    function syncCustomModelSelectUi() {
        const apiConfig = getApiConfig();
        const baseUrl = normalizeCustomApiBaseUrl(apiConfig.customApiBaseUrl);

        if (!baseUrl || baseUrl !== customModelState.sourceBaseUrl) {
            renderCustomModelSelect([]);
            return;
        }

        renderCustomModelSelect(customModelState.models, apiConfig.customModelName);
    }

    function extractModelIdsFromOpenAiListResponse(data) {
        const items = Array.isArray(data?.data) ? data.data : [];
        const ids = [];
        const seen = new Set();

        for (const item of items) {
            let modelId = '';

            if (typeof item === 'string') {
                modelId = item;
            } else if (item && typeof item === 'object') {
                modelId = String(item.id ?? item.model ?? item.name ?? '');
            }

            modelId = modelId.trim();
            if (!modelId || seen.has(modelId)) {
                continue;
            }

            seen.add(modelId);
            ids.push(modelId);
        }

        return ids;
    }

    async function readResponseJsonSafely(response) {
        try {
            return await response.clone().json();
        } catch (error) {
            return null;
        }
    }

    async function readResponseTextSafely(response) {
        try {
            return await response.clone().text();
        } catch (error) {
            return '';
        }
    }

    async function fetchCustomModelsList() {
        if (customModelState.isLoading) {
            return;
        }

        const apiConfig = getApiConfig();
        const baseUrl = normalizeCustomApiBaseUrl(apiConfig.customApiBaseUrl);
        const apiKey = String(apiConfig.customApiKey ?? '').trim();

        if (!baseUrl) {
            showMessage('warning', '请先填写 API地址。');
            return;
        }

        if (!apiKey) {
            showMessage('warning', '请先填写 API密钥。');
            return;
        }

        const url = joinUrl(baseUrl, 'models');
        if (!url) {
            showMessage('error', 'API地址不合法。');
            return;
        }

        customModelState.isLoading = true;
        setButtonBusyState(SELECTORS.apiCustomFetchModelsButton, true, '获取中...');
        renderCustomModelSelect([]);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
            });

            if (!response.ok) {
                const json = await readResponseJsonSafely(response);
                const text = await readResponseTextSafely(response);
                const message = String(json?.error?.message ?? json?.message ?? '').trim()
                    || (text ? text.slice(0, 300) : '')
                    || `获取模型列表失败（${response.status}）。`;
                throw new Error(message);
            }

            const data = await response.json();
            const modelIds = extractModelIdsFromOpenAiListResponse(data);

            if (modelIds.length === 0) {
                throw new Error('未获取到可用模型列表。');
            }

            customModelState.sourceBaseUrl = baseUrl;
            customModelState.models = modelIds;
            renderCustomModelSelect(modelIds, apiConfig.customModelName);
            showMessage('success', '已获取模型列表。');
        } catch (error) {
            console.error(`[${MODULE_NAME}] 获取模型列表失败`, error);
            customModelState.sourceBaseUrl = '';
            customModelState.models = [];
            renderCustomModelSelect([]);
            showMessage('error', error instanceof Error ? error.message : '获取模型列表失败。');
        } finally {
            customModelState.isLoading = false;
            setButtonBusyState(SELECTORS.apiCustomFetchModelsButton, false);
        }
    }

    function normalizeStopString(value, shouldUseCloseTagFormat, fallbackEndTagName = '') {
        const rawValue = String(value ?? '');
        if (!shouldUseCloseTagFormat) {
            return rawValue;
        }

        const normalizedFallback = normalizeTagName(fallbackEndTagName);
        const extracted = normalizeTagName(rawValue);
        const tagName = extracted || normalizedFallback;

        if (!tagName) {
            return '';
        }

        return `</${tagName}>`;
    }

    function syncStopStringWithEndTagIfNeeded() {
        const settings = loadSettings();
        const apiConfig = settings.apiConfig;
        const stopString = String(apiConfig.stopString ?? '');

        if (stopString.trim()) {
            return;
        }

        const startTagName = String(settings.startTag ?? '').trim();
        const endTagName = String(settings.endTag ?? '').trim();

        if (!startTagName || !endTagName) {
            return;
        }

        const normalized = normalizeStopString('', true, endTagName);
        if (!normalized) {
            return;
        }

        apiConfig.stopString = normalized;
        savePluginSettings();
        $(SELECTORS.apiStopStringInput).val(normalized);
    }

    function getEffectiveStopString() {
        const settings = loadSettings();
        const stopString = String(settings.apiConfig.stopString ?? '');
        if (stopString.trim()) {
            return stopString;
        }

        const startTagName = String(settings.startTag ?? '').trim();
        const endTagName = String(settings.endTag ?? '').trim();
        if (!startTagName || !endTagName) {
            return '';
        }

        return normalizeStopString('', true, endTagName);
    }

    function applyStopStringToReplyText(replyText, stopString) {
        const normalizedReplyText = String(replyText ?? '');
        const normalizedStopString = String(stopString ?? '');
        const trimmedStopString = normalizedStopString.trim();

        if (!trimmedStopString) {
            return normalizedReplyText;
        }

        const index = normalizedReplyText.indexOf(trimmedStopString);
        if (index === -1) {
            return normalizedReplyText;
        }

        return normalizedReplyText.slice(0, index + trimmedStopString.length);
    }

    function extractChatCompletionContent(data) {
        const choices = Array.isArray(data?.choices) ? data.choices : [];
        const firstChoice = choices.length > 0 ? choices[0] : null;

        if (firstChoice && typeof firstChoice === 'object') {
            const message = firstChoice.message;
            if (message && typeof message === 'object' && typeof message.content === 'string') {
                return message.content;
            }

            if (typeof firstChoice.text === 'string') {
                return firstChoice.text;
            }
        }

        return '';
    }

    async function generateWithCustomApi(promptText, resolvedApiConfig) {
        const baseUrl = normalizeCustomApiBaseUrl(resolvedApiConfig.customApiBaseUrl);
        const apiKey = String(resolvedApiConfig.customApiKey ?? '').trim();
        const modelName = String(resolvedApiConfig.customModelName ?? '').trim();

        if (!baseUrl) {
            throw new Error('请先填写 API地址。');
        }

        if (!apiKey) {
            throw new Error('请先填写 API密钥。');
        }

        if (!modelName) {
            throw new Error('请先填写 模型名称。');
        }

        const url = joinUrl(baseUrl, 'chat/completions');
        if (!url) {
            throw new Error('API地址不合法。');
        }

        const body = {
            model: modelName,
            messages: [
                {
                    role: 'user',
                    content: String(promptText ?? ''),
                },
            ],
            temperature: resolvedApiConfig.temperature,
            top_p: resolvedApiConfig.topP,
            presence_penalty: resolvedApiConfig.presencePenalty,
            frequency_penalty: resolvedApiConfig.frequencyPenalty,
            stream: false,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const json = await readResponseJsonSafely(response);
            const text = await readResponseTextSafely(response);
            const message = String(json?.error?.message ?? json?.message ?? '').trim()
                || (text ? text.slice(0, 300) : '')
                || `请求失败（${response.status}）。`;
            throw new Error(message);
        }

        const data = await response.json();
        const content = extractChatCompletionContent(data);
        if (!String(content ?? '').trim()) {
            throw new Error('AI 没有返回可用内容。');
        }

        return String(content);
    }

    function showReplyModal(text, chatId = '', source = '') {
        replyModalState.chatId = String(chatId ?? '');
        replyModalState.source = String(source ?? '');
        $(SELECTORS.replyModalTextarea).val(String(text ?? ''));
        ensureReplyModalMounted();
        $(SELECTORS.replyModal).fadeIn(200);

        const $textarea = $(SELECTORS.replyModalTextarea);
        if ($textarea.length) {
            $textarea.trigger('focus');
        }
    }

    function hideReplyModal() {
        const source = String(replyModalState.source ?? '');
        replyModalState.chatId = '';
        replyModalState.source = '';
        $(SELECTORS.replyModal).fadeOut(200);

        if (source === 'auto') {
            autoTriggerState.isBusy = false;
        }
    }

    function ensureReplyModalMounted() {
        const $modal = $(SELECTORS.replyModal);
        if (!$modal.length) {
            return;
        }

        const $body = $('body');
        if (!$body.length) {
            return;
        }

        if (!$modal.parent().is('body')) {
            $modal.detach();
            $body.append($modal);
        }
    }

    function ensureReplyModalMountedAtInit() {
        // Ensure modal is globally visible even when panel is hidden.
        ensureReplyModalMounted();
    }

    function escapeRegExp(value) {
        return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function extractAllTagInnerTexts(text, startTag, endTag) {
        const sourceText = String(text ?? '');
        const normalizedStartTag = String(startTag ?? '');
        const normalizedEndTag = String(endTag ?? '');

        if (!normalizedStartTag || !normalizedEndTag) {
            return [];
        }

        const regex = new RegExp(`${escapeRegExp(normalizedStartTag)}([\\s\\S]*?)${escapeRegExp(normalizedEndTag)}`, 'g');
        const values = [];
        let match;

        while ((match = regex.exec(sourceText)) !== null) {
            values.push(match[1] ?? '');
            if (match.index === regex.lastIndex) {
                regex.lastIndex += 1;
            }
        }

        return values;
    }

    function replaceAllTagInnerTexts(sourceText, startTag, endTag, replacements) {
        const normalizedSourceText = String(sourceText ?? '');
        const normalizedStartTag = String(startTag ?? '');
        const normalizedEndTag = String(endTag ?? '');

        if (!normalizedStartTag || !normalizedEndTag) {
            return normalizedSourceText;
        }

        const regex = new RegExp(`${escapeRegExp(normalizedStartTag)}([\\s\\S]*?)${escapeRegExp(normalizedEndTag)}`, 'g');
        let index = 0;

        return normalizedSourceText.replace(regex, () => {
            const replacement = index < replacements.length ? replacements[index] : '';
            index += 1;
            return `${normalizedStartTag}${replacement}${normalizedEndTag}`;
        });
    }

    function appendUnreplaceableContentToOutput(unreplaceableText) {
        const normalized = String(unreplaceableText ?? '').trim();
        if (!normalized) {
            return;
        }

        const current = getOutputText();
        const separator = current && current.trim() ? '\n\n' : '';
        setOutputText(`${current}${separator}${normalized}`);
        focusOutputTextarea();
    }

    async function triggerTavernHelperRenderRefresh(messageId) {
        const resolvedMessageId = Number(messageId);
        if (!Number.isFinite(resolvedMessageId)) {
            return;
        }

        let lastError = null;
        const tavernHelper = globalThis.TavernHelper;

        if (tavernHelper && typeof tavernHelper === 'object') {
            if (typeof tavernHelper.setChatMessages === 'function') {
                try {
                    await tavernHelper.setChatMessages(
                        [{ message_id: resolvedMessageId }],
                        { refresh: 'affected' },
                    );
                    return;
                } catch (error) {
                    lastError = error;
                }
            }

            if (typeof tavernHelper.renderOneMessage === 'function') {
                try {
                    await tavernHelper.renderOneMessage(resolvedMessageId);
                    return;
                } catch (error) {
                    lastError = error;
                }
            }

            if (typeof tavernHelper.refreshOneMessage === 'function') {
                try {
                    await tavernHelper.refreshOneMessage(resolvedMessageId);
                    return;
                } catch (error) {
                    lastError = error;
                }
            }
        }

        const builtin = globalThis.builtin;
        if (builtin && typeof builtin.reloadAndRenderChatWithoutEvents === 'function') {
            try {
                await builtin.reloadAndRenderChatWithoutEvents();
                return;
            } catch (error) {
                lastError = error;
            }
        }

        if (lastError) {
            console.warn(`[${MODULE_NAME}] 触发酒馆助手渲染刷新失败`, lastError);
        }
    }

    async function confirmReplaceLastMessage() {
        const latestContext = SillyTavern.getContext();
        const chat = latestContext?.chat;
        const currentChatId = getCurrentChatIdValue();

        const replyText = String($(SELECTORS.replyModalTextarea).val() ?? '');
        const replySource = String(replyModalState.source ?? '');

        if (!replySource) {
            return;
        }

        if (replySource !== 'manual' && autoTriggerState.stopRequested) {
            // 自动流程被用户停止：按要求 B，把内容写入截取与输出框，不替换消息。
            if ($(SELECTORS.replyModal).is(':visible')) {
                hideReplyModal();
            }
            showMessage('success', '已停止流程');
            if (replySource === 'auto') {
                appendUnreplaceableContentToOutput(replyText);
            }
            return;
        }

        if (replyModalState.chatId && currentChatId !== replyModalState.chatId) {
            hideReplyModal();
            showMessage('warning', '聊天窗口已切换，当前回复确认框已失效。');
            return;
        }

        if (!Array.isArray(chat) || chat.length === 0) {
            showMessage('warning', '当前聊天里没有可替换的消息。');
            return;
        }

        const lastIndex = chat.length - 1;
        const message = chat[lastIndex];

        if (!message || typeof message !== 'object') {
            showMessage('error', '无法替换最后一条消息。');
            return;
        }

        const settings = loadSettings();
        const shouldOnlyReplaceInTags = settings.keepTags && settings.onlyReplaceInTags;

        if (shouldOnlyReplaceInTags) {
            const rangeConfig = getRangeConfig();

            if (!rangeConfig.enabled || rangeConfig.invalid) {
                hideReplyModal();
                showMessage('warning', '找不到标签,无法替换的内容会输出到截取框末尾.');
                appendUnreplaceableContentToOutput(replyText);
                return;
            }

            const originalMes = String(message.mes ?? '');
            const oldInnerTexts = extractAllTagInnerTexts(originalMes, rangeConfig.startTag, rangeConfig.endTag);
            const newInnerTexts = extractAllTagInnerTexts(replyText, rangeConfig.startTag, rangeConfig.endTag);

            if (oldInnerTexts.length === 0 || newInnerTexts.length === 0 || oldInnerTexts.length !== newInnerTexts.length) {
                hideReplyModal();
                showMessage('warning', '找不到标签,无法替换的内容会输出到截取框末尾.');
                appendUnreplaceableContentToOutput(replyText);
                return;
            }

            message.mes = replaceAllTagInnerTexts(originalMes, rangeConfig.startTag, rangeConfig.endTag, newInnerTexts);
        } else {
            message.mes = replyText;
        }
        if (message.extra && typeof message.extra === 'object' && Object.prototype.hasOwnProperty.call(message.extra, 'display_text')) {
            delete message.extra.display_text;
        }

        if (typeof latestContext.updateMessageBlock === 'function') {
            latestContext.updateMessageBlock(lastIndex, message, { rerenderMessage: true });
        }

        if (typeof latestContext.saveChat === 'function') {
            await latestContext.saveChat();
        }

        hideReplyModal();
        showMessage('success', '已替换当前聊天的最后一条消息。');
        void triggerTavernHelperRenderRefresh(lastIndex);
    }

    async function handleManualSend() {
        if (manualSendState.isBusy) {
            return;
        }

        if (isAutoFlowActive()) {
            showMessage('warning', '当前正在进行自动触发');
            return;
        }

        const outputText = getOutputText().trim();
        if (!outputText) {
            showMessage('warning', '当前截取框里没有可发送的文字。');
            return;
        }

        const resolvedApiConfig = getResolvedApiConfig();
        const latestContext = SillyTavern.getContext();
        const isCustomSource = resolvedApiConfig.modelSource === 'custom';

        if (!isCustomSource) {
            if (!latestContext || (typeof latestContext.generateRaw !== 'function' && typeof latestContext.generateQuietPrompt !== 'function')) {
                showMessage('error', '当前宿主环境不支持手动发送。');
                return;
            }
        } else {
            if (typeof fetch !== 'function') {
                showMessage('error', '当前宿主环境不支持自定义 API 请求。');
                return;
            }
        }

        const chatIdBefore = getCurrentChatIdValue();
        const requestId = manualSendState.requestId + 1;
        manualSendState.requestId = requestId;
        manualSendState.chatId = chatIdBefore;
        setManualSendBusy(true);

        let restoreOverrides = () => {};

        try {
            let replyText = '';
            if (isCustomSource) {
                replyText = await generateWithCustomApi(outputText, resolvedApiConfig);
            } else {
                restoreOverrides = applyTemporaryGenerationOverrides(latestContext, resolvedApiConfig);
                if (typeof latestContext.generateRaw === 'function') {
                    replyText = await latestContext.generateRaw({ prompt: outputText });
                } else {
                    replyText = await latestContext.generateQuietPrompt({ quietPrompt: outputText });
                }
            }

            replyText = applyStopStringToReplyText(replyText, getEffectiveStopString());

            if (requestId !== manualSendState.requestId) {
                return;
            }

            if (getCurrentChatIdValue() !== chatIdBefore) {
                showMessage('warning', '聊天窗口已切换，本次回复未写入当前界面。');
                return;
            }

            if (!String(replyText ?? '').trim()) {
                showMessage('warning', 'AI 没有返回可用内容。');
                return;
            }

            showReplyModal(String(replyText), chatIdBefore, 'manual');
        } catch (error) {
            console.error(`[${MODULE_NAME}] 手动发送失败`, error);
            showMessage('error', error instanceof Error ? error.message : '手动发送失败。');
        } finally {
            restoreOverrides();
            if (requestId === manualSendState.requestId) {
                setManualSendBusy(false);
            }
        }
    }

    function handleChatChanged() {
        manualSendState.requestId += 1;
        if (manualSendState.isBusy) {
            setManualSendBusy(false);
        }

        if ($(SELECTORS.replyModal).is(':visible')) {
            const source = String(replyModalState.source ?? '');
            if (source === 'auto') {
                const replyText = String($(SELECTORS.replyModalTextarea).val() ?? '').trim();
                if (replyText) {
                    appendUnreplaceableContentToOutput(replyText);
                }
            }
            hideReplyModal();
        }

        // 自动触发仅当前 chat 生效：切换聊天视为关闭。
        autoTriggerState.enabledChatId = '';

        autoTriggerState.requestId += 1;
        autoTriggerState.isBusy = false;
        autoTriggerState.stopRequested = false;
        autoTriggerState.stoppedByUser = false;

        if (autoTriggerState.pendingTimerId) {
            window.clearTimeout(autoTriggerState.pendingTimerId);
            autoTriggerState.pendingTimerId = 0;
        }

        syncAutoTriggerUiState();
    }

    function stopManualFlow() {
        const isReplyModalVisible = $(SELECTORS.replyModal).is(':visible');
        const replySource = String(replyModalState.source ?? '');
        if (isAutoFlowActive()) {
            showMessage('warning', '当前正在进行自动触发');
            return;
        }

        const isSending = manualSendState.isBusy;
        const isManualConfirmVisible = isReplyModalVisible && replySource === 'manual';

        if (!isSending && !isManualConfirmVisible) {
            showMessage('warning', '当前没有进行流程');
            return;
        }

        if (isSending) {
            manualSendState.requestId += 1;
            setManualSendBusy(false);
            showMessage('success', '已停止流程');
            return;
        }

        if (isManualConfirmVisible) {
            void (async () => {
                const confirmed = await askConfirmDialog('停止流程', '是否关闭回复确认框？');
                if (!confirmed) {
                    return;
                }

                const isStillManualConfirmVisible = $(SELECTORS.replyModal).is(':visible')
                    && String(replyModalState.source ?? '') === 'manual';
                if (!isStillManualConfirmVisible) {
                    return;
                }

                hideReplyModal();
                showMessage('success', '已停止流程');
            })();
        }
    }

    function stopAutoFlow() {
        const isReplyModalVisible = $(SELECTORS.replyModal).is(':visible');
        const isAutoConfirmVisible = isReplyModalVisible && String(replyModalState.source ?? '') === 'auto';
        const hasPending = Boolean(autoTriggerState.pendingTimerId);

        if (!autoTriggerState.isBusy && !hasPending && !isAutoConfirmVisible) {
            showMessage('warning', '当前没有进行流程');
            return;
        }

        autoTriggerState.stopRequested = true;
        autoTriggerState.requestId += 1;
        autoTriggerState.isBusy = false;

        if (autoTriggerState.pendingTimerId) {
            window.clearTimeout(autoTriggerState.pendingTimerId);
            autoTriggerState.pendingTimerId = 0;
        }

        if (isAutoConfirmVisible) {
            const replyText = String($(SELECTORS.replyModalTextarea).val() ?? '').trim();
            if (replyText) {
                appendUnreplaceableContentToOutput(replyText);
            }
            hideReplyModal();
        }

        showMessage('success', '已停止流程');
    }

    function handleAutoTriggerEnabledCheckboxChanged() {
        const checked = $(SELECTORS.autoTriggerEnabledCheckbox).is(':checked');
        setAutoTriggerEnabledForCurrentChat(checked);
        syncAutoTriggerUiState();
    }

    function handleGenerationStopped() {
        autoTriggerState.stoppedByUser = true;
    }

    function handleGenerationEnded(chatLength) {
        if (!isAutoTriggerEnabledForCurrentChat()) {
            return;
        }

        // ST release 源码：点击停止会先 emit ENDED 再 emit STOPPED，因此必须延迟处理 ENDED。
        const requestId = autoTriggerState.requestId + 1;
        autoTriggerState.requestId = requestId;

        if (autoTriggerState.pendingTimerId) {
            window.clearTimeout(autoTriggerState.pendingTimerId);
        }

        autoTriggerState.pendingTimerId = window.setTimeout(async () => {
            autoTriggerState.pendingTimerId = 0;

            if (requestId !== autoTriggerState.requestId) {
                return;
            }

            if (autoTriggerState.stoppedByUser) {
                autoTriggerState.stoppedByUser = false;
                return;
            }
            autoTriggerState.stoppedByUser = false;

            if (!isAutoTriggerEnabledForCurrentChat()) {
                return;
            }

            if (autoTriggerState.isBusy) {
                return;
            }
            autoTriggerState.isBusy = true;
            autoTriggerState.stopRequested = false;

            try {
                const didExtract = await handleManualTrigger(true);
                if (!didExtract) {
                    return;
                }

                if (requestId !== autoTriggerState.requestId || autoTriggerState.stopRequested) {
                    return;
                }

                // 复用手动发送，但标记为 auto 来源以便停止自动流程时走 B 行为。
                const chatIdBefore = getCurrentChatIdValue();
                const outputText = getOutputText().trim();
                if (!outputText) {
                    return;
                }

                // 复制 handleManualSend 的最小逻辑：直接调用 handleManualSend 会被 autoTriggerState.isBusy 拦截。
                const resolvedApiConfig = getResolvedApiConfig();
                const latestContext = SillyTavern.getContext();
                const isCustomSource = resolvedApiConfig.modelSource === 'custom';

                if (!isCustomSource) {
                    if (!latestContext || (typeof latestContext.generateRaw !== 'function' && typeof latestContext.generateQuietPrompt !== 'function')) {
                        showMessage('error', '当前宿主环境不支持手动发送。');
                        return;
                    }
                } else {
                    if (typeof fetch !== 'function') {
                        showMessage('error', '当前宿主环境不支持自定义 API 请求。');
                        return;
                    }
                }

                const manualRequestId = manualSendState.requestId + 1;
                manualSendState.requestId = manualRequestId;
                manualSendState.chatId = chatIdBefore;
                setManualSendBusy(true);

                let restoreOverrides = () => {};

                try {
                    let replyText = '';
                    if (isCustomSource) {
                        replyText = await generateWithCustomApi(outputText, resolvedApiConfig);
                    } else {
                        restoreOverrides = applyTemporaryGenerationOverrides(latestContext, resolvedApiConfig);
                        if (typeof latestContext.generateRaw === 'function') {
                            replyText = await latestContext.generateRaw({ prompt: outputText });
                        } else {
                            replyText = await latestContext.generateQuietPrompt({ quietPrompt: outputText });
                        }
                    }

                    replyText = applyStopStringToReplyText(replyText, getEffectiveStopString());

                    if (requestId !== autoTriggerState.requestId || autoTriggerState.stopRequested) {
                        return;
                    }

                    if (manualRequestId !== manualSendState.requestId) {
                        return;
                    }

                    if (getCurrentChatIdValue() !== chatIdBefore) {
                        showMessage('warning', '聊天窗口已切换，本次回复未写入当前界面。');
                        return;
                    }

                    if (!String(replyText ?? '').trim()) {
                        showMessage('warning', 'AI 没有返回可用内容。');
                        return;
                    }

                    showReplyModal(String(replyText), chatIdBefore, 'auto');
                } catch (error) {
                    console.error(`[${MODULE_NAME}] 自动触发发送失败`, error);
                    showMessage('error', error instanceof Error ? error.message : '手动发送失败。');
                } finally {
                    restoreOverrides();
                    if (manualRequestId === manualSendState.requestId) {
                        setManualSendBusy(false);
                    }
                }
            } catch (error) {
                console.error(`[${MODULE_NAME}] 自动触发流程失败`, error);
                showMessage('error', error instanceof Error ? error.message : '自动触发流程失败。');
            } finally {
                if (requestId === autoTriggerState.requestId) {
                    const isAutoConfirmVisible = $(SELECTORS.replyModal).is(':visible')
                        && String(replyModalState.source ?? '') === 'auto';
                    if (!isAutoConfirmVisible) {
                        autoTriggerState.isBusy = false;
                    }
                }
            }
        }, 0);
    }

    // 显示/隐藏全屏面板
    function togglePanel() {
        const $panel = $(SELECTORS.panel);
        const willShow = !$panel.is(':visible');

        if (willShow) {
            if (isMobileLayout()) {
                setMobilePanelView('menu');
            } else {
                syncMobileTabsUi();
            }
        }

        $panel.fadeToggle(200);
    }

    function hidePanel() {
        $(SELECTORS.panel).fadeOut(200);
    }

    function setOutputText(text) {
        const $textarea = $(SELECTORS.outputTextarea);
        if (!$textarea.length) {
            return;
        }

        $textarea.val(text ?? '');
    }

    function getOutputText() {
        const $textarea = $(SELECTORS.outputTextarea);
        if (!$textarea.length) {
            return '';
        }

        return String($textarea.val() ?? '');
    }

    function focusOutputTextarea() {
        const $textarea = $(SELECTORS.outputTextarea);
        if (!$textarea.length) {
            return;
        }

        $textarea.focus();

        const element = $textarea.get(0);
        if (element && typeof element.setSelectionRange === 'function') {
            const len = element.value.length;
            element.setSelectionRange(len, len);
        }
    }

    function setExtractedBaseText(text) {
        extractedBaseText = String(text ?? '');
    }

    function sanitizeSingleTagInput(selector) {
        const $input = $(selector);
        if (!$input.length) {
            return '';
        }

        const normalized = normalizeTagName($input.val());
        if ($input.val() !== normalized) {
            $input.val(normalized);
        }

        return normalized;
    }

    function updateTagSettingFromInput(selector, settingsKey) {
        const normalized = sanitizeSingleTagInput(selector);
        const settings = loadSettings();

        if (settings[settingsKey] !== normalized) {
            settings[settingsKey] = normalized;
            savePluginSettings();
        }

        return normalized;
    }

    function syncKeepTagsSettingFromCheckbox() {
        const settings = loadSettings();
        const checked = $(SELECTORS.keepTagsCheckbox).is(':checked');

        if (settings.keepTags !== checked) {
            settings.keepTags = checked;
            savePluginSettings();
        }

        syncOnlyReplaceInTagsUi();

        return checked;
    }

    function syncOnlyReplaceInTagsUi() {
        const settings = loadSettings();
        const $checkbox = $(SELECTORS.onlyReplaceInTagsCheckbox);
        if (!$checkbox.length) {
            return;
        }

        const disabled = !settings.keepTags;
        $checkbox.prop('checked', Boolean(settings.onlyReplaceInTags));
        $checkbox.prop('disabled', disabled);
        $checkbox.closest('label').toggleClass('is-disabled', disabled);
    }

    function syncUiFromSettings() {
        const settings = loadSettings();

        $(SELECTORS.keepTagsCheckbox).prop('checked', settings.keepTags);
        syncOnlyReplaceInTagsUi();
        $(SELECTORS.startTagInput).val(settings.startTag);
        $(SELECTORS.endTagInput).val(settings.endTag);

        renderTemplateList();
        syncTemplateEditorState();
        syncApiConfigUi();
        updateManualSendUiState();
        syncAutoTriggerUiState();
    }

    function syncAutoTriggerUiState() {
        $(SELECTORS.autoTriggerEnabledCheckbox).prop('checked', isAutoTriggerEnabledForCurrentChat());
    }

    function getRangeConfig() {
        const startName = updateTagSettingFromInput(SELECTORS.startTagInput, 'startTag');
        const endName = updateTagSettingFromInput(SELECTORS.endTagInput, 'endTag');
        const keepTags = syncKeepTagsSettingFromCheckbox();

        if (!startName && !endName) {
            return {
                enabled: false,
                invalid: false,
                keepTags,
                startTag: '',
                endTag: '',
            };
        }

        if (!startName || !endName) {
            return {
                enabled: true,
                invalid: true,
                keepTags,
                startTag: '',
                endTag: '',
                message: RANGE_INCOMPLETE_TEXT,
            };
        }

        return {
            enabled: true,
            invalid: false,
            keepTags,
            startTag: `<${startName}>`,
            endTag: `</${endName}>`,
            startName,
            endName,
        };
    }

    // 切换到 范围设置 标签页
    function switchTabToRange() {
        $(SELECTORS.menuBtns).removeClass('active');
        $(SELECTORS.rangeToggleButton).addClass('active');
        
        $(SELECTORS.captureSendSettings).hide();
        $(SELECTORS.apiSettings).hide();
        $(SELECTORS.templateSettings).hide();
        $(SELECTORS.rangeSettings).fadeIn(200);
        $(SELECTORS.startTagInput).focus();
    }

    // 切换到 模板设置 标签页
    function switchTabToTemplate() {
        $(SELECTORS.menuBtns).removeClass('active');
        $(SELECTORS.templateToggleButton).addClass('active');
        
        $(SELECTORS.rangeSettings).hide();
        $(SELECTORS.captureSendSettings).hide();
        $(SELECTORS.apiSettings).hide();
        $(SELECTORS.templateSettings).fadeIn(200);
        syncTemplateEditorState();
    }

    function switchTabToCaptureSend() {
        $(SELECTORS.menuBtns).removeClass('active');
        $(SELECTORS.captureSendToggleButton).addClass('active');

        $(SELECTORS.rangeSettings).hide();
        $(SELECTORS.templateSettings).hide();
        $(SELECTORS.apiSettings).hide();
        $(SELECTORS.captureSendSettings).fadeIn(200);
    }

    function switchTabToApiSettings() {
        $(SELECTORS.menuBtns).removeClass('active');
        $(SELECTORS.apiToggleButton).addClass('active');

        $(SELECTORS.rangeSettings).hide();
        $(SELECTORS.templateSettings).hide();
        $(SELECTORS.captureSendSettings).hide();
        $(SELECTORS.apiSettings).fadeIn(200);
    }

    function switchTabToAutoTrigger() {
        $(SELECTORS.menuBtns).removeClass('active');
        $(SELECTORS.autoTriggerToggleButton).addClass('active');

        $(SELECTORS.rangeSettings).hide();
        $(SELECTORS.templateSettings).hide();
        $(SELECTORS.captureSendSettings).hide();
        $(SELECTORS.apiSettings).hide();
        $(SELECTORS.autoTriggerSettings).fadeIn(200);
    }

    function getLastMessageText() {
        const latestContext = SillyTavern.getContext();
        const chat = latestContext?.chat;

        if (!Array.isArray(chat) || chat.length === 0) {
            return '';
        }

        const message = chat[chat.length - 1];
        if (!message) {
            return '';
        }

        if (typeof message.mes === 'string') {
            return message.mes;
        }

        if (message.mes !== undefined && message.mes !== null) {
            return String(message.mes);
        }

        return '';
    }

    function extractTextByRange(sourceText) {
        const fullText = typeof sourceText === 'string' ? sourceText : String(sourceText ?? '');
        const rangeConfig = getRangeConfig();

        if (!rangeConfig.enabled) {
            return {
                ok: true,
                text: fullText,
                usedRange: false,
            };
        }

        if (rangeConfig.invalid) {
            return {
                ok: false,
                reason: 'range_incomplete',
                message: rangeConfig.message,
            };
        }

        const startIndex = fullText.indexOf(rangeConfig.startTag);
        if (startIndex === -1) {
            return {
                ok: false,
                reason: 'range_not_found',
                message: RANGE_NOT_FOUND_TEXT,
            };
        }

        const contentStartIndex = startIndex + rangeConfig.startTag.length;
        const endIndex = fullText.indexOf(rangeConfig.endTag, contentStartIndex);

        if (endIndex === -1) {
            return {
                ok: false,
                reason: 'range_not_found',
                message: RANGE_NOT_FOUND_TEXT,
            };
        }

        const text = rangeConfig.keepTags
            ? fullText.slice(startIndex, endIndex + rangeConfig.endTag.length)
            : fullText.slice(contentStartIndex, endIndex);

        return {
            ok: true,
            text,
            usedRange: true,
            keepTags: rangeConfig.keepTags,
            startTag: rangeConfig.startTag,
            endTag: rangeConfig.endTag,
        };
    }

    async function handleManualTrigger(allowWhenAutoBusy = false) {
        if (isAutoFlowActive() && !allowWhenAutoBusy) {
            showMessage('warning', '当前正在进行自动触发');
            return false;
        }

        const lastMessageText = getLastMessageText();

        if (!lastMessageText || !String(lastMessageText).trim()) {
            setExtractedBaseText('');
            setOutputText(EMPTY_CHAT_TEXT);
            focusOutputTextarea();
            return false;
        }

        const result = extractTextByRange(lastMessageText);

        if (!result.ok) {
            if (result.reason === 'range_incomplete') {
                showMessage('warning', RANGE_INCOMPLETE_TEXT);
            } else {
                showMessage('error', RANGE_NOT_FOUND_TEXT);
            }

            setExtractedBaseText('');
            setOutputText(result.message);
            focusOutputTextarea();
            return false;
        }

        setExtractedBaseText(result.text);
        syncOutputFromSelectedTemplates(true);
        return true;
    }

    function findTemplateById(templateId) {
        const settings = loadSettings();
        return settings.templates.find(item => item.id === templateId) || null;
    }

    function getSelectedTemplateList(settings = loadSettings()) {
        const selectedTemplateIdSet = new Set(settings.selectedTemplateIds);
        return settings.templates.filter(item => selectedTemplateIdSet.has(item.id));
    }

    function hasTemplateLabel(label, templates, excludedTemplateId = '') {
        const normalizedLabel = String(label ?? '').trim();
        return templates.some(item => item.id !== excludedTemplateId && String(item.label ?? '').trim() === normalizedLabel);
    }

    function getNextDefaultTemplateLabel(templates) {
        if (!hasTemplateLabel('默认模板', templates)) {
            return '默认模板';
        }

        let index = 1;
        while (hasTemplateLabel(`默认模板${index}`, templates)) {
            index += 1;
        }

        return `默认模板${index}`;
    }

    function stripFileExtension(fileName) {
        return String(fileName ?? '').replace(/\.[^.]+$/, '').trim();
    }

    function getNextImportedTemplateLabel(baseLabel, templates) {
        const normalizedBaseLabel = String(baseLabel ?? '').trim() || '模板';

        if (!hasTemplateLabel(normalizedBaseLabel, templates)) {
            return normalizedBaseLabel;
        }

        let index = 1;
        while (hasTemplateLabel(`${normalizedBaseLabel}(${index})`, templates)) {
            index += 1;
        }

        return `${normalizedBaseLabel}(${index})`;
    }

    function getTemplateEditorDraftContent() {
        const $textarea = $(SELECTORS.templateEditorTextarea);
        if (!$textarea.length) {
            return templateEditorState ? templateEditorState.originalContent : '';
        }

        return String($textarea.val() ?? '');
    }

    function getTemplateEditorDraftLabel() {
        const $input = $(SELECTORS.templateEditorLabelInput);
        if (!$input.length) {
            return templateEditorState ? templateEditorState.originalLabel : '';
        }

        return String($input.val() ?? '');
    }

    function resetTemplateEditorUi() {
        $(SELECTORS.templateEditorTitle).text('编辑模板');
        $(SELECTORS.templateEditorLabelInput).val('');
        $(SELECTORS.templateEditorTextarea).val('');
    }

    function showTemplateBrowseView() {
        $(SELECTORS.templateBrowseView).show();
        $(SELECTORS.templateEditorView).hide();
    }

    function showTemplateEditorView() {
        $(SELECTORS.templateBrowseView).hide();
        $(SELECTORS.templateEditorView).show();
    }

    function leaveTemplateEditor() {
        templateEditorState = null;
        resetTemplateEditorUi();
        showTemplateBrowseView();
    }

    function isTemplateEditorDirty() {
        return Boolean(templateEditorState) && (
            getTemplateEditorDraftContent() !== templateEditorState.originalContent
            || getTemplateEditorDraftLabel() !== templateEditorState.originalLabel
        );
    }

    async function confirmExitTemplateEditorIfDirty() {
        if (!isTemplateEditorDirty()) {
            return true;
        }

        return await askConfirmDialog('退出编辑', '当前模板内容尚未保存，确定退出吗？');
    }

    function syncTemplateEditorState() {
        if (!templateEditorState) {
            showTemplateBrowseView();
            resetTemplateEditorUi();
            return;
        }

        const template = findTemplateById(templateEditorState.templateId);
        if (!template) {
            leaveTemplateEditor();
            return;
        }

        $(SELECTORS.templateEditorTitle).text(`编辑模板：${template.label}`);
        showTemplateEditorView();
    }

    async function openTemplateEditor(templateId) {
        const template = findTemplateById(templateId);
        if (!template) {
            showMessage('warning', '没有找到要编辑的模板。');
            return;
        }

        if (templateEditorState && templateEditorState.templateId !== templateId) {
            const confirmed = await confirmExitTemplateEditorIfDirty();
            if (!confirmed) {
                return;
            }
        }

        if (!templateEditorState || templateEditorState.templateId !== templateId) {
            templateEditorState = {
                templateId: template.id,
                originalLabel: template.label,
                originalContent: template.content,
            };
            $(SELECTORS.templateEditorLabelInput).val(template.label);
            $(SELECTORS.templateEditorTextarea).val(template.content);
        }

        $(SELECTORS.templateEditorTitle).text(`编辑模板：${template.label}`);
        showTemplateEditorView();

        const $textarea = $(SELECTORS.templateEditorTextarea);
        if ($textarea.length) {
            $textarea.trigger('focus');

            const element = $textarea.get(0);
            if (element && typeof element.setSelectionRange === 'function') {
                const len = element.value.length;
                element.setSelectionRange(len, len);
            }
        }
    }

    async function handleTemplateEditorExit() {
        const confirmed = await confirmExitTemplateEditorIfDirty();
        if (!confirmed) {
            return;
        }

        leaveTemplateEditor();
    }

    function handleTemplateEditorSave() {
        if (!templateEditorState) {
            return;
        }

        const template = findTemplateById(templateEditorState.templateId);
        if (!template) {
            leaveTemplateEditor();
            showMessage('warning', '没有找到要保存的模板。');
            return;
        }

        const nextLabel = getTemplateEditorDraftLabel().trim();
        if (!nextLabel) {
            showMessage('warning', '按钮名称不能为空。');
            return;
        }

        template.label = nextLabel;
        const nextContent = getTemplateEditorDraftContent();
        template.content = nextContent;
        templateEditorState.originalLabel = nextLabel;
        templateEditorState.originalContent = nextContent;

        savePluginSettings();
        renderTemplateList();
        syncOutputFromSelectedTemplates();
        $(SELECTORS.templateEditorTitle).text(`编辑模板：${template.label}`);
        showMessage('success', '模板名称和内容已保存。');
    }

    function addTemplate() {
        const settings = loadSettings();
        const label = getNextDefaultTemplateLabel(settings.templates);

        settings.templates.push({
            id: createTemplateId(settings.templates.length),
            label,
            content: '',
        });

        savePluginSettings();
        renderTemplateList();
        showMessage('success', `已新增模板“${label}”。`);
    }

    function downloadTextFile(fileName, text, mimeType) {
        const blob = new Blob([text], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');

        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        window.setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 0);
    }

    function exportSelectedTemplates() {
        const settings = loadSettings();
        const selectedTemplates = getSelectedTemplateList(settings);

        if (selectedTemplates.length === 0) {
            showMessage('warning', '请先选定要导出的模板按钮。');
            return;
        }

        try {
            selectedTemplates.forEach(template => {
                const fileContent = JSON.stringify({
                    id: template.id,
                    label: template.label,
                    content: template.content,
                }, null, 2);

                downloadTextFile(`${template.label}.json`, fileContent, 'application/json;charset=utf-8');
            });

            showMessage('success', `已导出 ${selectedTemplates.length} 个模板。`);
        } catch (error) {
            console.error(`[${MODULE_NAME}] 导出模板失败`, error);
            showMessage('error', '导出模板失败。');
        }
    }

    function triggerTemplateImport() {
        const $input = $(SELECTORS.templateImportInput);
        if (!$input.length) {
            showMessage('error', '导入控件未加载。');
            return;
        }

        $input.val('');

        const element = $input.get(0);
        if (element && typeof element.click === 'function') {
            element.click();
        }
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(reader.error || new Error('读取文件失败。'));

            reader.readAsText(file, 'utf-8');
        });
    }

    async function importTemplateFromFile(file) {
        if (!file) {
            return;
        }

        try {
            if (!String(file.name ?? '').toLowerCase().endsWith('.json')) {
                throw new Error('导入失败：请选择 JSON 文件。');
            }

            const fileText = await readFileAsText(file);
            const parsed = JSON.parse(fileText);

            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Object.prototype.hasOwnProperty.call(parsed, 'content')) {
                throw new Error('导入失败：JSON 中缺少 content 字段。');
            }

            if (parsed.content !== null && typeof parsed.content !== 'string') {
                throw new Error('导入失败：content 必须是字符串。');
            }

            const settings = loadSettings();
            const label = getNextImportedTemplateLabel(stripFileExtension(file.name), settings.templates);

            settings.templates.push({
                id: createTemplateId(settings.templates.length),
                label,
                content: String(parsed.content ?? ''),
            });

            savePluginSettings();
            renderTemplateList();
            showMessage('success', `已导入模板“${label}”。`);
        } catch (error) {
            console.error(`[${MODULE_NAME}] 导入模板失败`, error);
            showMessage('error', error instanceof Error ? error.message : '导入模板失败。');
        } finally {
            $(SELECTORS.templateImportInput).val('');
        }
    }

    function applyTemplateText(templateText, currentText) {
        const normalizedTemplateText = String(templateText ?? '');
        const normalizedCurrentText = String(currentText ?? '');

        if (normalizedTemplateText.includes('{{text}}')) {
            return normalizedTemplateText.replace(/\{\{text\}\}/g, normalizedCurrentText);
        }

        if (!normalizedCurrentText.trim()) {
            return normalizedTemplateText;
        }

        if (!normalizedTemplateText.trim()) {
            return normalizedCurrentText;
        }

        return `${normalizedTemplateText}\n\n${normalizedCurrentText}`;
    }

    function buildOutputFromSelectedTemplates(baseText, settings = loadSettings()) {
        const selectedTemplates = getSelectedTemplateList(settings);
        let nextText = String(baseText ?? '');

        for (let i = selectedTemplates.length - 1; i >= 0; i--) {
            nextText = applyTemplateText(selectedTemplates[i].content, nextText);
        }

        return nextText;
    }

    function syncOutputFromSelectedTemplates(shouldFocus = false) {
        const settings = loadSettings();
        const nextText = buildOutputFromSelectedTemplates(extractedBaseText, settings);

        setOutputText(nextText);

        if (shouldFocus) {
            focusOutputTextarea();
        }
    }

    function toggleTemplateSelection(templateId) {
        const template = findTemplateById(templateId);
        if (!template) {
            showMessage('warning', '没有找到对应的模板按钮。');
            return;
        }

        const settings = loadSettings();
        const selectedTemplateIds = settings.selectedTemplateIds;
        const selectedIndex = selectedTemplateIds.indexOf(templateId);

        if (selectedIndex === -1) {
            selectedTemplateIds.push(templateId);
        } else {
            selectedTemplateIds.splice(selectedIndex, 1);
        }

        savePluginSettings();
        renderTemplateList();
        syncOutputFromSelectedTemplates();
    }

    function moveTemplate(templateId, direction) {
        const settings = loadSettings();
        const list = settings.templates;
        const currentIndex = list.findIndex(item => item.id === templateId);

        if (currentIndex === -1) {
            return;
        }

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= list.length) {
            return;
        }

        [list[currentIndex], list[targetIndex]] = [list[targetIndex], list[currentIndex]];
        savePluginSettings();
        renderTemplateList();
        syncOutputFromSelectedTemplates();
    }

    function deleteTemplateById(templateId) {
        const settings = loadSettings();
        const originalLength = settings.templates.length;

        settings.templates = settings.templates.filter(item => item.id !== templateId);

        if (settings.templates.length === originalLength) {
            return;
        }

        settings.selectedTemplateIds = settings.selectedTemplateIds.filter(id => id !== templateId);
        if (templateEditorState && templateEditorState.templateId === templateId) {
            leaveTemplateEditor();
        }

        savePluginSettings();
        renderTemplateList();
        syncOutputFromSelectedTemplates();
        showMessage('success', '模板按钮已删除。');
    }

    async function handleDeleteSelectedTemplates() {
        const settings = loadSettings();
        const selectedTemplates = getSelectedTemplateList(settings);

        if (selectedTemplates.length === 0) {
            showMessage('warning', '请先选定要删除的模板按钮。');
            return;
        }

        const confirmed = await askConfirmDialog(
            '删除选定模板',
            `确定删除已选定的 ${selectedTemplates.length} 个模板按钮吗？`
        );

        if (!confirmed) {
            return;
        }

        const selectedTemplateIdSet = new Set(selectedTemplates.map(item => item.id));
        settings.templates = settings.templates.filter(item => !selectedTemplateIdSet.has(item.id));
        settings.selectedTemplateIds = [];

        if (templateEditorState && selectedTemplateIdSet.has(templateEditorState.templateId)) {
            leaveTemplateEditor();
        }

        savePluginSettings();
        renderTemplateList();
        syncOutputFromSelectedTemplates();
        showMessage('success', `已删除 ${selectedTemplates.length} 个模板按钮。`);
    }

    function renderTemplateList() {
        const $list = $(SELECTORS.templateList);
        if (!$list.length) {
            return;
        }

        const settings = loadSettings();
        const templates = Array.isArray(settings.templates) ? settings.templates : [];
        const selectedTemplateIdSet = new Set(settings.selectedTemplateIds);

        if (templates.length === 0) {
            $list.html(`
                <div class="my-topbar-test-template-empty">
                    当前没有模板按钮。
                </div>
            `);
            return;
        }

        const html = templates.map((item, index) => {
            const templateId = escapeHtml(item.id);
            const label = escapeHtml(item.label);
            const isFirst = index === 0;
            const isLast = index === templates.length - 1;
            const isSelected = selectedTemplateIdSet.has(item.id);

            return `
                <div class="my-topbar-test-template-item${isSelected ? ' is-selected' : ''}" data-template-id="${templateId}">
                    <div class="my-topbar-test-template-move">
                        <button type="button"
                                class="menu_button my-topbar-test-template-move-button"
                                data-direction="up"
                                data-template-id="${templateId}"
                                title="上移"
                                ${isFirst ? 'disabled' : ''}>
                            ↑
                        </button>
                        <button type="button"
                                class="menu_button my-topbar-test-template-move-button"
                                data-direction="down"
                                data-template-id="${templateId}"
                                title="下移"
                                ${isLast ? 'disabled' : ''}>
                            ↓
                        </button>
                    </div>

                    <div class="my-topbar-test-template-main">
                        <div class="my-topbar-test-template-combo">
                            <button type="button"
                                    class="menu_button my-topbar-test-template-apply${isSelected ? ' is-selected' : ''}"
                                    data-template-id="${templateId}"
                                    title="点击切换选定状态"
                                    aria-pressed="${isSelected ? 'true' : 'false'}">
                                ${label}
                            </button>

                            <button type="button"
                                    class="menu_button my-topbar-test-template-edit-button"
                                    data-template-id="${templateId}"
                                    title="编辑模板内容"
                                    aria-label="编辑模板内容：${label}">
                                编辑
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        $list.html(html);
    }

    function getPanelHtml() {
        return `
            <div id="my-topbar-test-panel" class="my-topbar-test-fullscreen-overlay" style="display: none;">
                <div class="my-topbar-test-container">
                    <div id="my-topbar-test-close-btn" class="my-topbar-test-close-btn" title="关闭面板">
                        <i class="fa-solid fa-times"></i>
                    </div>

                    <div id="my-topbar-test-mobile-tabs" class="my-topbar-test-mobile-tabs">
                        <button id="my-topbar-test-mobile-back"
                                class="menu_button my-topbar-test-mobile-back"
                                type="button"
                                aria-label="返回功能菜单">
                            <i class="fa-solid fa-chevron-left"></i> 返回
                        </button>
                        <div class="my-topbar-test-mobile-tab-buttons">
                            <button id="my-topbar-test-mobile-tab-menu"
                                    class="menu_button my-topbar-test-mobile-tab active"
                                    type="button"
                                    aria-pressed="true">
                                功能菜单
                            </button>
                            <button id="my-topbar-test-mobile-tab-output"
                                    class="menu_button my-topbar-test-mobile-tab"
                                    type="button"
                                    aria-pressed="false">
                                截取与输出
                            </button>
                        </div>
                    </div>

                    <div class="my-topbar-test-col-left">
                        <div class="my-topbar-test-section-title">功能菜单</div>
                        
                        <button id="my-topbar-test-range-toggle"
                                class="menu_button my-topbar-test-menu-btn active"
                                type="button">
                            <i class="fa-solid fa-code"></i> 设置范围
                        </button>

                        <button id="my-topbar-test-template-toggle"
                                class="menu_button my-topbar-test-menu-btn"
                                type="button">
                            <i class="fa-solid fa-layer-group"></i> 提示词模板
                        </button>

                        <button id="my-topbar-test-capture-send-toggle"
                                class="menu_button my-topbar-test-menu-btn"
                                type="button">
                            <i class="fa-solid fa-paper-plane"></i> 截取与发送
                        </button>

                        <button id="my-topbar-test-api-toggle"
                                class="menu_button my-topbar-test-menu-btn"
                                type="button">
                            <i class="fa-solid fa-link"></i> api链接
                        </button>

                        <button id="my-topbar-test-auto-trigger-toggle"
                                class="menu_button my-topbar-test-menu-btn"
                                type="button">
                            <i class="fa-solid fa-robot"></i> 自动触发
                        </button>

                    </div>

                    <div class="my-topbar-test-col-middle">
                        <div class="my-topbar-test-section-title">设置详情</div>

                        <div id="my-topbar-test-range-settings" class="my-topbar-test-settings-section">
                            <label for="my-topbar-test-keep-tags" class="my-topbar-test-keep-tags-row">
                                <input id="my-topbar-test-keep-tags"
                                       class="my-topbar-test-keep-tags-checkbox"
                                       type="checkbox">
                                <span class="my-topbar-test-keep-tags-text">保留标签</span>
                            </label>

                            <label for="my-topbar-test-only-replace-in-tags" class="my-topbar-test-keep-tags-row my-topbar-test-only-replace-row">
                                <input id="my-topbar-test-only-replace-in-tags"
                                       class="my-topbar-test-keep-tags-checkbox"
                                       type="checkbox"
                                       disabled>
                                <span class="my-topbar-test-keep-tags-text">仅替换标签内</span>
                            </label>

                            <div class="my-topbar-test-range-only-replace-tip">
                                勾选仅替换标签内,只会替换聊天记录相同的标签内的内容<br>
                                找不到标签,无法替换的内容会输出到截取框末尾.
                            </div>

                            <div class="my-topbar-test-range-row">
                                <label for="my-topbar-test-start-tag" class="my-topbar-test-label">开始标签</label>
                                <div class="my-topbar-test-tag-input-wrap">
                                    <span class="my-topbar-test-tag-prefix">&lt;</span>
                                    <input id="my-topbar-test-start-tag"
                                           class="my-topbar-test-tag-input"
                                           type="text"
                                           placeholder="例如：text"
                                           spellcheck="false"
                                           autocomplete="off">
                                    <span class="my-topbar-test-tag-suffix">&gt;</span>
                                </div>
                            </div>

                            <div class="my-topbar-test-range-row">
                                <label for="my-topbar-test-end-tag" class="my-topbar-test-label">结束标签</label>
                                <div class="my-topbar-test-tag-input-wrap">
                                    <span class="my-topbar-test-tag-prefix">&lt;/</span>
                                    <input id="my-topbar-test-end-tag"
                                           class="my-topbar-test-tag-input"
                                           type="text"
                                           placeholder="例如：text"
                                           spellcheck="false"
                                           autocomplete="off">
                                    <span class="my-topbar-test-tag-suffix">&gt;</span>
                                </div>
                            </div>

                            <div class="my-topbar-test-range-tip">
                                留空时默认截取整条最后消息。<br>
                                例如开始标签填 text，结束标签也填 text，就会截取 &lt;text&gt; 和 &lt;/text&gt; 之间的内容。<br>
                                打开“保留标签”后，输出会连同开始和结束标签一起保留。
                            </div>
                        </div>

                        <div id="my-topbar-test-template-settings" class="my-topbar-test-settings-section" style="display: none;">
                            <div id="my-topbar-test-template-browse-view" class="my-topbar-test-template-browse-view">
                                <div class="my-topbar-test-template-tip">
                                    点击模板切换选定状态，点击编辑修改按钮名称和模板内容，上下箭头可调整顺序。
                                </div>

                                <div class="my-topbar-test-template-tools">
                                    <button id="my-topbar-test-template-delete-selected"
                                            class="menu_button my-topbar-test-template-tool-button"
                                            type="button">
                                        删除选定
                                    </button>
                                    <button id="my-topbar-test-template-add"
                                            class="menu_button my-topbar-test-template-tool-button"
                                            type="button">
                                        添加模板
                                    </button>
                                    <button id="my-topbar-test-template-export"
                                            class="menu_button my-topbar-test-template-tool-button"
                                            type="button">
                                        导出
                                    </button>
                                    <button id="my-topbar-test-template-import"
                                            class="menu_button my-topbar-test-template-tool-button"
                                            type="button">
                                        导入
                                    </button>
                                </div>

                                <div id="my-topbar-test-template-list" class="my-topbar-test-template-list"></div>
                            </div>

                            <div id="my-topbar-test-template-editor-view" class="my-topbar-test-template-editor-view" style="display: none;">
                                <div id="my-topbar-test-template-editor-title" class="my-topbar-test-template-editor-title">编辑模板</div>
                                <label for="my-topbar-test-template-editor-label" class="my-topbar-test-label">按钮名称</label>
                                <input id="my-topbar-test-template-editor-label"
                                       class="text_pole my-topbar-test-template-editor-input"
                                       type="text"
                                       spellcheck="false"
                                       placeholder="请输入按钮名称"
                                       autocomplete="off">
                                <label for="my-topbar-test-template-editor-text" class="my-topbar-test-label">模板内容</label>
                                <textarea id="my-topbar-test-template-editor-text"
                                          class="text_pole my-topbar-test-template-editor-textarea"
                                          spellcheck="false"
                                          placeholder="请输入模板内容"></textarea>
                                <div class="my-topbar-test-template-editor-actions">
                                    <button id="my-topbar-test-template-editor-save"
                                            class="menu_button my-topbar-test-template-tool-button"
                                            type="button">
                                        保存
                                    </button>
                                    <button id="my-topbar-test-template-editor-exit"
                                            class="menu_button my-topbar-test-template-tool-button"
                                            type="button">
                                        退出
                                    </button>
                                </div>
                            </div>

                            <input id="my-topbar-test-template-import-input"
                                   type="file"
                                   accept=".json,application/json"
                                   hidden>
                        </div>

                        <div id="my-topbar-test-capture-send-settings" class="my-topbar-test-settings-section" style="display: none;">
                            <div class="my-topbar-test-template-tip">
                                先手动截取，再把当前截取框中的内容复制发送给 AI。发送完成后会弹出确认框，确认后替换当前聊天窗口最后一条消息。
                            </div>

                            <div class="my-topbar-test-capture-send-actions">
                                <button id="my-topbar-test-manual-trigger"
                                        class="menu_button my-topbar-test-menu-btn my-topbar-test-trigger-btn"
                                        type="button">
                                    <i class="fa-solid fa-bolt"></i> 手动触发
                                </button>
                                <button id="my-topbar-test-manual-send"
                                        class="menu_button my-topbar-test-menu-btn my-topbar-test-send-btn"
                                        type="button">
                                    <i class="fa-solid fa-paper-plane"></i> 手动发送
                                </button>
                                <button id="my-topbar-test-stop-manual-flow"
                                        class="menu_button my-topbar-test-menu-btn"
                                        type="button">
                                    停止手动流程
                                </button>
                            </div>
                        </div>

                        <div id="my-topbar-test-api-settings" class="my-topbar-test-settings-section" style="display: none;">
                            <div class="my-topbar-test-api-grid">
                                <div class="my-topbar-test-api-field">
                                    <label for="my-topbar-test-api-temperature" class="my-topbar-test-label">模型温度</label>
                                    <input id="my-topbar-test-api-temperature" class="text_pole my-topbar-test-api-input" type="number" step="0.1" placeholder="1">
                                </div>

                                <div class="my-topbar-test-api-field">
                                    <label for="my-topbar-test-api-top-p" class="my-topbar-test-label">Top-P</label>
                                    <input id="my-topbar-test-api-top-p" class="text_pole my-topbar-test-api-input" type="number" step="0.1" placeholder="1">
                                </div>

                                <div class="my-topbar-test-api-field">
                                    <label for="my-topbar-test-api-top-k" class="my-topbar-test-label">Top-k</label>
                                    <input id="my-topbar-test-api-top-k" class="text_pole my-topbar-test-api-input" type="number" step="1" placeholder="0">
                                </div>

                                <div class="my-topbar-test-api-field">
                                    <label for="my-topbar-test-api-presence-penalty" class="my-topbar-test-label">存在惩罚</label>
                                    <input id="my-topbar-test-api-presence-penalty" class="text_pole my-topbar-test-api-input" type="number" step="0.1" placeholder="0">
                                </div>

                                <div class="my-topbar-test-api-field">
                                    <label for="my-topbar-test-api-frequency-penalty" class="my-topbar-test-label">频率惩罚</label>
                                    <input id="my-topbar-test-api-frequency-penalty" class="text_pole my-topbar-test-api-input" type="number" step="0.1" placeholder="0">
                                </div>

                                 <label for="my-topbar-test-api-stream" class="my-topbar-test-keep-tags-row my-topbar-test-api-stream-row">
                                     <input id="my-topbar-test-api-stream" class="my-topbar-test-keep-tags-checkbox" type="checkbox">
                                     <span class="my-topbar-test-keep-tags-text">流式输出</span>
                                 </label>

                                 <div class="my-topbar-test-api-field my-topbar-test-api-stop-field">
                                     <label for="my-topbar-test-api-stop-string" class="my-topbar-test-label">停止字符</label>
                                     <input id="my-topbar-test-api-stop-string" class="text_pole my-topbar-test-api-input" type="text" spellcheck="false" autocomplete="off">
                                 </div>
                             </div>

                            <div class="my-topbar-test-api-drawer">
                                <button id="my-topbar-test-api-source-toggle"
                                        class="menu_button my-topbar-test-api-drawer-toggle"
                                        type="button">
                                    模型来源
                                </button>
                                 <div id="my-topbar-test-api-source-body" class="my-topbar-test-api-drawer-body" style="display: none;">
                                     <button id="my-topbar-test-api-source-current"
                                             class="menu_button my-topbar-test-api-source-current"
                                             type="button">
                                         与酒馆相同
                                     </button>
                                     <div id="my-topbar-test-api-source-options" class="my-topbar-test-api-source-options" style="display: none;"></div>

                                     <div id="my-topbar-test-api-custom-config" class="my-topbar-test-api-custom-config" style="display: none;">
                                         <div class="my-topbar-test-api-field">
                                             <label for="my-topbar-test-api-custom-base-url" class="my-topbar-test-label">API地址</label>
                                             <input id="my-topbar-test-api-custom-base-url" class="text_pole my-topbar-test-api-input" type="text" spellcheck="false" autocomplete="off">
                                         </div>

                                         <div class="my-topbar-test-api-field">
                                             <label for="my-topbar-test-api-custom-api-key" class="my-topbar-test-label">API密钥</label>
                                             <input id="my-topbar-test-api-custom-api-key" class="text_pole my-topbar-test-api-input" type="password" spellcheck="false" autocomplete="off">
                                         </div>

                                         <div class="my-topbar-test-api-field">
                                             <label for="my-topbar-test-api-custom-model-name" class="my-topbar-test-label">模型名称</label>
                                             <input id="my-topbar-test-api-custom-model-name" class="text_pole my-topbar-test-api-input" type="text" spellcheck="false" autocomplete="off">
                                         </div>

                                         <div class="my-topbar-test-api-field">
                                             <label class="my-topbar-test-label">获取模型</label>
                                             <button id="my-topbar-test-api-custom-fetch-models"
                                                     class="menu_button my-topbar-test-template-tool-button"
                                                     type="button">
                                                 获取模型
                                             </button>
                                             <select id="my-topbar-test-api-custom-model-select"
                                                     class="text_pole my-topbar-test-api-input my-topbar-test-api-model-select"
                                                     disabled>
                                                 <option value="">获取列表选择</option>
                                             </select>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                          </div>
                     </div>

                     <div id="my-topbar-test-auto-trigger-settings" class="my-topbar-test-settings-section" style="display: none;">
                         <label for="my-topbar-test-auto-trigger-enabled" class="my-topbar-test-keep-tags-row">
                             <input id="my-topbar-test-auto-trigger-enabled"
                                    class="my-topbar-test-keep-tags-checkbox"
                                    type="checkbox">
                             <span class="my-topbar-test-keep-tags-text">开启自动触发</span>
                         </label>

                         <button id="my-topbar-test-auto-trigger-stop"
                                 class="menu_button my-topbar-test-menu-btn"
                                 type="button">
                             停止自动流程
                         </button>
                     </div>

                     <div class="my-topbar-test-col-right">
                        <div class="my-topbar-test-section-title">截取与输出</div>
                        <label for="my-topbar-test-output" class="my-topbar-test-label" style="margin-bottom: 8px; display: block;">
                            这里会显示当前聊天窗口最底部最后一条消息；如果设置了范围，则只显示标签之间的内容（可编辑）
                        </label>

                        <textarea id="my-topbar-test-output"
                                  class="text_pole my-topbar-test-textarea"
                                  placeholder="点击“截取与发送”里的“手动触发”后，这里会自动填入内容。"
                                  spellcheck="false">琳喵喵很高兴为您服务</textarea>
                    </div>
                </div>

                <div id="my-topbar-test-reply-modal" class="my-topbar-test-reply-modal" style="display: none;">
                    <div class="my-topbar-test-reply-modal-card">
                        <button id="my-topbar-test-reply-modal-close"
                                class="menu_button my-topbar-test-reply-modal-close"
                                type="button"
                                aria-label="关闭回复确认框">
                            ×
                        </button>
                        <div class="my-topbar-test-reply-modal-title">AI 回复确认</div>
                        <textarea id="my-topbar-test-reply-modal-text"
                                  class="text_pole my-topbar-test-reply-modal-textarea"
                                  spellcheck="false"
                                  placeholder="这里会显示 AI 的完整回复，可编辑后再确认替换。"></textarea>
                        <div class="my-topbar-test-reply-modal-actions">
                            <button id="my-topbar-test-reply-modal-confirm"
                                    class="menu_button my-topbar-test-template-tool-button"
                                    type="button">
                                确认
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async function mountPanel() {
        if ($(SELECTORS.panel).length) {
            return;
        }

        try {
            const html = await $.get(`${EXTENSION_PATH}/settings.html`);
            $('body').append(html);
        } catch (error) {
            console.error(`[${MODULE_NAME}] 加载 settings.html 失败，使用备用面板。`, error);
            $('body').append(getPanelHtml());
        }
    }

    function mountButton() {
        const $topBar = $(SELECTORS.topBar);

        if (!$topBar.length) {
            console.error(`[${MODULE_NAME}] 找不到 #top-bar`);
            return;
        }

        $(SELECTORS.button).remove();

        const $button = $(`
            <div id="my-topbar-test-button"
                 style="display: flex;"
                 class="interactable"
                 title="琳喵喵后处理"
                 tabindex="0"
                 role="button"
                 aria-label="琳喵喵后处理">
                <span class="my-topbar-test-button-letter">H</span>
            </div>
        `);

        const $anchor = $(SELECTORS.anchor);
        if ($anchor.length) {
            $anchor.after($button);
        } else {
            $topBar.append($button);
        }
    }

    function bindEvents() {
        // 顶部按钮点击打开面板
        $(document)
            .off('click.myTopbarTest', SELECTORS.button)
            .on('click.myTopbarTest', SELECTORS.button, function (e) {
                e.preventDefault();
                e.stopPropagation();
                togglePanel();
            });

        $(document)
            .off('keydown.myTopbarTest', SELECTORS.button)
            .on('keydown.myTopbarTest', SELECTORS.button, function (e) {
                if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePanel();
                }
            });

        // 关闭按钮点击关闭面板
        $(document)
            .off('click.myTopbarTestClose', SELECTORS.closeBtn)
            .on('click.myTopbarTestClose', SELECTORS.closeBtn, function(e) {
                e.preventDefault();
                e.stopPropagation();
                hidePanel();
            });

        $(document)
            .off('click.myTopbarTestMobileTabMenu', SELECTORS.mobileTabMenu)
            .on('click.myTopbarTestMobileTabMenu', SELECTORS.mobileTabMenu, function (e) {
                e.preventDefault();
                e.stopPropagation();
                setMobilePanelView('menu');
            });

        $(document)
            .off('click.myTopbarTestMobileTabOutput', SELECTORS.mobileTabOutput)
            .on('click.myTopbarTestMobileTabOutput', SELECTORS.mobileTabOutput, function (e) {
                e.preventDefault();
                e.stopPropagation();
                setMobilePanelView('output');
            });

        $(document)
            .off('click.myTopbarTestMobileBack', SELECTORS.mobileBackButton)
            .on('click.myTopbarTestMobileBack', SELECTORS.mobileBackButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                setMobilePanelView('menu');
            });

        // 切换到 范围设置 标签
        $(document)
            .off('click.myTopbarTestRangeToggle', SELECTORS.rangeToggleButton)
            .on('click.myTopbarTestRangeToggle', SELECTORS.rangeToggleButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                switchTabToRange();
                if (isMobileLayout()) {
                    setMobilePanelView('detail');
                }
            });

        // 切换到 模板设置 标签
        $(document)
            .off('click.myTopbarTestTemplateToggle', SELECTORS.templateToggleButton)
            .on('click.myTopbarTestTemplateToggle', SELECTORS.templateToggleButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                switchTabToTemplate();
                if (isMobileLayout()) {
                    setMobilePanelView('detail');
                }
            });

        $(document)
            .off('click.myTopbarTestCaptureSendToggle', SELECTORS.captureSendToggleButton)
            .on('click.myTopbarTestCaptureSendToggle', SELECTORS.captureSendToggleButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                switchTabToCaptureSend();
                if (isMobileLayout()) {
                    setMobilePanelView('detail');
                }
            });

        $(document)
            .off('click.myTopbarTestApiToggle', SELECTORS.apiToggleButton)
            .on('click.myTopbarTestApiToggle', SELECTORS.apiToggleButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                switchTabToApiSettings();
                if (isMobileLayout()) {
                    setMobilePanelView('detail');
                }
            });

        $(document)
            .off('click.myTopbarTestAutoTriggerToggle', SELECTORS.autoTriggerToggleButton)
            .on('click.myTopbarTestAutoTriggerToggle', SELECTORS.autoTriggerToggleButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                switchTabToAutoTrigger();
                if (isMobileLayout()) {
                    setMobilePanelView('detail');
                }
            });

        $(document)
            .off('change.myTopbarTestAutoTriggerEnabled', SELECTORS.autoTriggerEnabledCheckbox)
            .on('change.myTopbarTestAutoTriggerEnabled', SELECTORS.autoTriggerEnabledCheckbox, function () {
                handleAutoTriggerEnabledCheckboxChanged();
            });

        $(document)
            .off('click.myTopbarTestAutoTriggerStop', SELECTORS.autoTriggerStopButton)
            .on('click.myTopbarTestAutoTriggerStop', SELECTORS.autoTriggerStopButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                stopAutoFlow();
            });

        $(document)
            .off('change.myTopbarTestKeepTags', SELECTORS.keepTagsCheckbox)
            .on('change.myTopbarTestKeepTags', SELECTORS.keepTagsCheckbox, function () {
                syncKeepTagsSettingFromCheckbox();
            });

        $(document)
            .off('change.myTopbarTestOnlyReplaceInTags', SELECTORS.onlyReplaceInTagsCheckbox)
            .on('change.myTopbarTestOnlyReplaceInTags', SELECTORS.onlyReplaceInTagsCheckbox, function () {
                const settings = loadSettings();
                settings.onlyReplaceInTags = $(SELECTORS.onlyReplaceInTagsCheckbox).is(':checked');
                savePluginSettings();
                syncOnlyReplaceInTagsUi();
            });

        $(document)
            .off('input.myTopbarTestStartTag', SELECTORS.startTagInput)
            .on('input.myTopbarTestStartTag', SELECTORS.startTagInput, function () {
                updateTagSettingFromInput(SELECTORS.startTagInput, 'startTag');
                syncStopStringWithEndTagIfNeeded();
            });

        $(document)
            .off('input.myTopbarTestEndTag', SELECTORS.endTagInput)
            .on('input.myTopbarTestEndTag', SELECTORS.endTagInput, function () {
                updateTagSettingFromInput(SELECTORS.endTagInput, 'endTag');
                syncStopStringWithEndTagIfNeeded();
            });

        $(document)
            .off('input.myTopbarTestApiTemperature', SELECTORS.apiTemperatureInput)
            .on('input.myTopbarTestApiTemperature', SELECTORS.apiTemperatureInput, function () {
                updateApiConfigString(SELECTORS.apiTemperatureInput, 'temperature');
            });

        $(document)
            .off('input.myTopbarTestApiTopP', SELECTORS.apiTopPInput)
            .on('input.myTopbarTestApiTopP', SELECTORS.apiTopPInput, function () {
                updateApiConfigString(SELECTORS.apiTopPInput, 'topP');
            });

        $(document)
            .off('input.myTopbarTestApiTopK', SELECTORS.apiTopKInput)
            .on('input.myTopbarTestApiTopK', SELECTORS.apiTopKInput, function () {
                updateApiConfigString(SELECTORS.apiTopKInput, 'topK');
            });

        $(document)
            .off('input.myTopbarTestApiPresencePenalty', SELECTORS.apiPresencePenaltyInput)
            .on('input.myTopbarTestApiPresencePenalty', SELECTORS.apiPresencePenaltyInput, function () {
                updateApiConfigString(SELECTORS.apiPresencePenaltyInput, 'presencePenalty');
            });

        $(document)
            .off('input.myTopbarTestApiFrequencyPenalty', SELECTORS.apiFrequencyPenaltyInput)
            .on('input.myTopbarTestApiFrequencyPenalty', SELECTORS.apiFrequencyPenaltyInput, function () {
                updateApiConfigString(SELECTORS.apiFrequencyPenaltyInput, 'frequencyPenalty');
            });

        $(document)
            .off('change.myTopbarTestApiStream', SELECTORS.apiStreamCheckbox)
            .on('change.myTopbarTestApiStream', SELECTORS.apiStreamCheckbox, function () {
                updateApiConfigBoolean(SELECTORS.apiStreamCheckbox, 'stream');
            });

        $(document)
            .off('input.myTopbarTestApiStopString', SELECTORS.apiStopStringInput)
            .on('input.myTopbarTestApiStopString', SELECTORS.apiStopStringInput, function () {
                const rawValue = String($(this).val() ?? '');
                const settings = loadSettings();
                const hasTags = Boolean(String(settings.startTag ?? '').trim() && String(settings.endTag ?? '').trim());
                const normalized = normalizeStopString(rawValue, hasTags, settings.endTag);
                if (rawValue !== normalized) {
                    $(this).val(normalized);
                }
                updateApiConfigField('stopString', normalized);
            });

        $(document)
            .off('input.myTopbarTestCustomApiBaseUrl', SELECTORS.apiCustomBaseUrlInput)
            .on('input.myTopbarTestCustomApiBaseUrl', SELECTORS.apiCustomBaseUrlInput, function () {
                const value = String($(this).val() ?? '');
                updateApiConfigField('customApiBaseUrl', value);

                const normalized = normalizeCustomApiBaseUrl(value);
                if (normalized !== customModelState.sourceBaseUrl) {
                    customModelState.sourceBaseUrl = '';
                    customModelState.models = [];
                    renderCustomModelSelect([]);
                }
            });

        $(document)
            .off('input.myTopbarTestCustomApiKey', SELECTORS.apiCustomApiKeyInput)
            .on('input.myTopbarTestCustomApiKey', SELECTORS.apiCustomApiKeyInput, function () {
                updateApiConfigField('customApiKey', String($(this).val() ?? ''));
            });

        $(document)
            .off('input.myTopbarTestCustomModelName', SELECTORS.apiCustomModelNameInput)
            .on('input.myTopbarTestCustomModelName', SELECTORS.apiCustomModelNameInput, function () {
                updateApiConfigField('customModelName', String($(this).val() ?? ''));
                syncCustomModelSelectUi();
            });

        $(document)
            .off('click.myTopbarTestCustomFetchModels', SELECTORS.apiCustomFetchModelsButton)
            .on('click.myTopbarTestCustomFetchModels', SELECTORS.apiCustomFetchModelsButton, async function (e) {
                e.preventDefault();
                e.stopPropagation();
                await fetchCustomModelsList();
            });

        $(document)
            .off('change.myTopbarTestCustomModelSelect', SELECTORS.apiCustomModelSelect)
            .on('change.myTopbarTestCustomModelSelect', SELECTORS.apiCustomModelSelect, function () {
                const selectedModel = String($(this).val() ?? '');
                $(SELECTORS.apiCustomModelNameInput).val(selectedModel);
                updateApiConfigField('customModelName', selectedModel);
            });

        $(document)
            .off('click.myTopbarTestApiSourceToggle', SELECTORS.apiModelSourceToggle)
            .on('click.myTopbarTestApiSourceToggle', SELECTORS.apiModelSourceToggle, function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleApiSourceDrawer();
            });

        $(document)
            .off('click.myTopbarTestApiSourceCurrent', SELECTORS.apiModelSourceCurrent)
            .on('click.myTopbarTestApiSourceCurrent', SELECTORS.apiModelSourceCurrent, function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleApiSourceOptions();
            });

        $(document)
            .off('click.myTopbarTestApiSourceOption', SELECTORS.apiModelSourceOptionButton)
            .on('click.myTopbarTestApiSourceOption', SELECTORS.apiModelSourceOptionButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                const value = String($(this).attr('data-source-value') ?? 'same');
                setApiModelSource(value);
            });

        $(document)
            .off('click.myTopbarTestTemplateDeleteSelected', SELECTORS.templateDeleteSelectedButton)
            .on('click.myTopbarTestTemplateDeleteSelected', SELECTORS.templateDeleteSelectedButton, async function (e) {
                e.preventDefault();
                e.stopPropagation();
                await handleDeleteSelectedTemplates();
            });

        $(document)
            .off('click.myTopbarTestTemplateAdd', SELECTORS.templateAddButton)
            .on('click.myTopbarTestTemplateAdd', SELECTORS.templateAddButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                addTemplate();
            });

        $(document)
            .off('click.myTopbarTestTemplateExport', SELECTORS.templateExportButton)
            .on('click.myTopbarTestTemplateExport', SELECTORS.templateExportButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                exportSelectedTemplates();
            });

        $(document)
            .off('click.myTopbarTestTemplateImport', SELECTORS.templateImportButton)
            .on('click.myTopbarTestTemplateImport', SELECTORS.templateImportButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                triggerTemplateImport();
            });

        $(document)
            .off('change.myTopbarTestTemplateImportInput', SELECTORS.templateImportInput)
            .on('change.myTopbarTestTemplateImportInput', SELECTORS.templateImportInput, async function () {
                const file = this.files && this.files[0] ? this.files[0] : null;
                await importTemplateFromFile(file);
            });

        $(document)
            .off('click.myTopbarTestTemplateEdit', SELECTORS.templateEditButton)
            .on('click.myTopbarTestTemplateEdit', SELECTORS.templateEditButton, async function (e) {
                e.preventDefault();
                e.stopPropagation();

                const templateId = String($(this).attr('data-template-id') ?? '');
                await openTemplateEditor(templateId);
            });

        $(document)
            .off('click.myTopbarTestTemplateEditorSave', SELECTORS.templateEditorSaveButton)
            .on('click.myTopbarTestTemplateEditorSave', SELECTORS.templateEditorSaveButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                handleTemplateEditorSave();
            });

        $(document)
            .off('click.myTopbarTestTemplateEditorExit', SELECTORS.templateEditorExitButton)
            .on('click.myTopbarTestTemplateEditorExit', SELECTORS.templateEditorExitButton, async function (e) {
                e.preventDefault();
                e.stopPropagation();
                await handleTemplateEditorExit();
            });

        $(document)
            .off('click.myTopbarTestTemplateMove', SELECTORS.templateMoveButton)
            .on('click.myTopbarTestTemplateMove', SELECTORS.templateMoveButton, function (e) {
                e.preventDefault();
                e.stopPropagation();

                const templateId = String($(this).attr('data-template-id') ?? '');
                const direction = String($(this).attr('data-direction') ?? '');

                moveTemplate(templateId, direction);
            });

        $(document)
            .off('click.myTopbarTestTemplateApply', SELECTORS.templateApplyButton)
            .on('click.myTopbarTestTemplateApply', SELECTORS.templateApplyButton, function (e) {
                const templateId = String($(this).attr('data-template-id') ?? '');
                toggleTemplateSelection(templateId);
            });

        $(document)
            .off('click.myTopbarTestManualTrigger', SELECTORS.manualTriggerButton)
            .on('click.myTopbarTestManualTrigger', SELECTORS.manualTriggerButton, async function (e) {
                e.preventDefault();
                e.stopPropagation();
                await handleManualTrigger();
            });

        $(document)
            .off('click.myTopbarTestManualSend', SELECTORS.manualSendButton)
            .on('click.myTopbarTestManualSend', SELECTORS.manualSendButton, async function (e) {
                e.preventDefault();
                e.stopPropagation();
                await handleManualSend();
            });

        $(document)
            .off('click.myTopbarTestStopManualFlow', SELECTORS.stopManualFlowButton)
            .on('click.myTopbarTestStopManualFlow', SELECTORS.stopManualFlowButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                stopManualFlow();
            });

        $(document)
            .off('click.myTopbarTestReplyModalConfirm', SELECTORS.replyModalConfirmButton)
            .on('click.myTopbarTestReplyModalConfirm', SELECTORS.replyModalConfirmButton, async function (e) {
                e.preventDefault();
                e.stopPropagation();
                await confirmReplaceLastMessage();
            });

        $(document)
            .off('click.myTopbarTestReplyModalClose', SELECTORS.replyModalCloseButton)
            .on('click.myTopbarTestReplyModalClose', SELECTORS.replyModalCloseButton, function (e) {
                e.preventDefault();
                e.stopPropagation();
                hideReplyModal();
            });
    }

    async function init() {
        loadSettings();
        await mountPanel();
        syncUiFromSettings();
        syncMobileTabsUi();
        setExtractedBaseText(DEFAULT_TEXT);
        syncOutputFromSelectedTemplates();
        ensureReplyModalMountedAtInit();
        mountButton();
        bindEvents();
        eventSource.off?.(event_types.CHAT_CHANGED, handleChatChanged);
        eventSource.on(event_types.CHAT_CHANGED, handleChatChanged);

        eventSource.off?.(event_types.GENERATION_STOPPED, handleGenerationStopped);
        eventSource.on(event_types.GENERATION_STOPPED, handleGenerationStopped);
        eventSource.off?.(event_types.GENERATION_ENDED, handleGenerationEnded);
        eventSource.on(event_types.GENERATION_ENDED, handleGenerationEnded);

        if (!initialized) {
            initialized = true;
            log('插件已加载完成');
        }
    }

    eventSource.on(event_types.APP_READY, init);
})();

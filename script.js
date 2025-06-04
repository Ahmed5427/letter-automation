// Configuration
const CONFIG = {
    SPREADSHEET_ID: '1cLbTgbluZyWYHRouEgqHQuYQqKexHhu4st9ANzuaxGk',
    API_KEY: 'AIzaSyBqF-nMxyZMrjmdFbULO9I_j75hXXaiq4A',
    GENERATE_API: '/.netlify/functions/generate-letter',
    ARCHIVE_API: '/.netlify/functions/archive-letter'
};

// Global variables
let currentTheme = 'light';
let spreadsheetData = {};
let generatedLetter = '';
let selectedTemplate = null;
let lettersData = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadSpreadsheetData();
    initializeEventListeners();
    loadTheme();
});

// Theme management
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    const icon = document.querySelector('.theme-toggle i');
    icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    const icon = document.querySelector;
    ('.theme-toggle i');
    icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Page navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId + '-page').classList.add('active');
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load page-specific data
    if (pageId === 'history') {
        loadLettersHistory();
    } else if (pageId === 'review') {
        loadReviewLetterOptions();
    }
}

// Load spreadsheet data for dropdowns
// Load spreadsheet data for dropdowns
async function loadSpreadsheetData() {
    try {
        showLoading();
        
        // Load Settings worksheet
        const settingsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/Settings?key=${CONFIG.API_KEY}`;
        console.log('Fetching from:', settingsUrl);
        
        const settingsResponse = await fetch(settingsUrl);
        
        if (!settingsResponse.ok) {
            throw new Error(`HTTP error! status: ${settingsResponse.status}`);
        }
        
        const settingsData = await settingsResponse.json();
        console.log('Settings data received:', settingsData);
        
        if (settingsData.values && settingsData.values.length > 0) {
            populateDropdowns(settingsData.values);
        } else {
            console.error('No values found in Settings worksheet');
            showNotification('لم يتم العثور على بيانات في ورقة الإعدادات', 'warning');
        }
        
        // Load Submissions worksheet
        const submissionsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/Submissions?key=${CONFIG.API_KEY}`;
        const submissionsResponse = await fetch(submissionsUrl);
        
        if (submissionsResponse.ok) {
            const submissionsData = await submissionsResponse.json();
            if (submissionsData.values) {
                lettersData = submissionsData.values;
                console.log('Submissions data loaded:', lettersData.length, 'rows');
            }
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error loading spreadsheet data:', error);
        hideLoading();
        showNotification('خطأ في تحميل البيانات: ' + error.message, 'error');
        
        // Show manual test button for debugging
        addDebugButton();
    }
}

function populateDropdowns(data) {
    if (!data || data.length < 2) {
        console.error('No data available in spreadsheet');
        return;
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    console.log('Headers:', headers);
    console.log('Data rows:', rows);
    
    // Based on your sheet structure:
    // Column B (index 1) = نوع الخطاب
    // Column C (index 2) = الغرض من الخطاب
    // Column G (index 6) = الأسلوب
    
    const letterTypeCol = 1; // Column B
    const purposeCol = 2;    // Column C  
    const styleCol = 6;      // Column G
    
    // Populate letter type dropdown (نوع الخطاب)
    const letterTypeSelect = document.getElementById('letter-type');
    letterTypeSelect.innerHTML = '<option value="">اختر نوع الخطاب</option>';
    
    const letterTypes = [...new Set(rows.map(row => row[letterTypeCol]).filter(value => value && value.trim() !== ''))];
    console.log('Letter types found:', letterTypes);
    
    letterTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        letterTypeSelect.appendChild(option);
    });
    
    // Populate purpose dropdown (الغرض من الخطاب)
    const purposeSelect = document.getElementById('letter-purpose');
    purposeSelect.innerHTML = '<option value="">اختر الغرض</option>';
    
    const purposes = [...new Set(rows.map(row => row[purposeCol]).filter(value => value && value.trim() !== ''))];
    console.log('Purposes found:', purposes);
    
    purposes.forEach(purpose => {
        const option = document.createElement('option');
        option.value = purpose;
        option.textContent = purpose;
        purposeSelect.appendChild(option);
    });
    
    // Populate style dropdown (الأسلوب)
    const styleSelect = document.getElementById('letter-style');
    styleSelect.innerHTML = '<option value="">اختر الأسلوب</option>';
    
    const styles = [...new Set(rows.map(row => row[styleCol]).filter(value => value && value.trim() !== ''))];
    console.log('Styles found:', styles);
    
    styles.forEach(style => {
        const option = document.createElement('option');
        option.value = style;
        option.textContent = style;
        styleSelect.appendChild(option);
    });
    
    // Populate review filter dropdown
    const reviewFilter = document.getElementById('review-filter');
    if (reviewFilter) {
        reviewFilter.innerHTML = '<option value="">جميع حالات المراجعة</option>';
        const reviewStatuses = ['في الانتظار', 'جاهز للإرسال', 'يحتاج إلى تحسينات', 'مرفوض'];
        reviewStatuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            reviewFilter.appendChild(option);
        });
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Letter form submission
    document.getElementById('letter-form').addEventListener('submit', handleLetterGeneration);
    
    // Template selection
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedTemplate = this.dataset.template;
            document.getElementById('save-proceed').disabled = false;
        });
    });
    
    // Save and proceed button
    document.getElementById('save-proceed').addEventListener('click', handleSaveAndProceed);
    
    // Review form events
    document.getElementById('review-letter-select').addEventListener('change', handleReviewLetterSelection);
    document.getElementById('review-completed').addEventListener('change', handleReviewCheckbox);
    
    // Review action buttons
    document.getElementById('needs-improvement').addEventListener('click', () => handleReviewAction('يحتاج إلى تحسينات'));
    document.getElementById('ready-to-send').addEventListener('click', () => handleReviewAction('جاهز للإرسال'));
    document.getElementById('rejected').addEventListener('click', () => handleReviewAction('مرفوض'));
    
    // Search and filter events
    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('type-filter').addEventListener('change', handleFilter);
    document.getElementById('review-filter').addEventListener('change', handleFilter);
}

// Handle letter generation
// Handle letter generation
// Updated handleLetterGeneration function
async function handleLetterGeneration(event) {
    event.preventDefault();
    
    // ... validation code ...
    
    const letterData = {
        category: letterType,
        sub_category: letterPurpose,
        title: letterTitle,
        recipient: recipient,
        isFirst: isFirstRadio.value === 'true',
        prompt: letterContent,
        tone: letterStyle
    };
    
    try {
        showLoading();
        showNotification('جاري إنشاء الخطاب... قد يستغرق 10-15 ثانية', 'info');
        
        const response = await fetch(CONFIG.GENERATE_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(letterData)
        });
        
        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response text:', responseText);
        
        if (!response.ok) {
            if (response.status === 408) {
                throw new Error('انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى - قد يكون الخادم مشغولاً');
            }
            throw new Error(`HTTP ${response.status}: ${responseText}`);
        }
        
        let result = JSON.parse(responseText);
        const generatedLetter = result.letter || result.content || result.generated_letter || result.text;
        
        if (!generatedLetter) {
            throw new Error('لم يتم استلام محتوى الخطاب');
        }
        
        document.getElementById('generated-letter').value = generatedLetter;
        document.getElementById('preview-section').style.display = 'block';
        document.getElementById('preview-section').scrollIntoView({ behavior: 'smooth' });
        
        hideLoading();
        showNotification('تم إنشاء الخطاب بنجاح!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        
        let errorMessage = 'فشل في إنشاء الخطاب: ' + error.message;
        if (error.message.includes('timeout') || error.message.includes('انتهت مهلة')) {
            errorMessage = 'الخادم يستغرق وقتاً أطول من المتوقع. يرجى المحاولة مرة أخرى.';
        }
        
        showNotification(errorMessage, 'error');
    }
}
// Handle save and proceed
async function handleSaveAndProceed() {
    const letterContent = document.getElementById('generated-letter').value;
    
    // Prepare data for archiving
    const archiveData = {
        letter_content: letterContent,
        letter_type: document.getElementById('letter-type').value,
        recipient: document.getElementById('recipient').value,
        title: document.getElementById('letter-title').value,
        is_first: document.querySelector('input[name="first-correspondence"]:checked').value,
        ID: generateUniqueId(),
        file: btoa(letterContent) // Convert to base64 for transmission
    };
    
    try {
        showLoading();
        
        const response = await fetch(CONFIG.ARCHIVE_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(archiveData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Archive response:', result);
        
        hideLoading();
        showNotification('تم حفظ الخطاب بنجاح', 'success');
        
        // Reset form and return to home
        document.getElementById('letter-form').reset();
        document.getElementById('preview-section').style.display = 'none';
        selectedTemplate = null;
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.getElementById('save-proceed').disabled = true;
        
        showPage('home');
        
    } catch (error) {
        console.error('Error saving letter:', error);
        hideLoading();
        showNotification('فشل في حفظ الخطاب: ' + error.message, 'error');
    }
}

// Load letters history
function loadLettersHistory() {
    const tbody = document.querySelector('#letters-list tbody');
    tbody.innerHTML = '';
    
    if (!lettersData || lettersData.length <= 1) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا توجد خطابات</td></tr>';
        return;
    }
    
    const headers = lettersData[0];
    const rows = lettersData.slice(1);
    
    rows.forEach(row => {
        const tr = document.createElement('tr');
        
        const letterType = translateLetterType(row[3] || '');
        const reviewStatus = row[9] || 'في الانتظار';
        const sendStatus = row[10] || 'في الانتظار';
        
        tr.innerHTML = `
            <td>${row[0] || ''}</td>
            <td>${row[1] || ''}</td>
            <td>${letterType}</td>
            <td><span class="status-${getStatusClass(reviewStatus)}">${reviewStatus}</span></td>
            <td><span class="status-${getStatusClass(sendStatus)}">${sendStatus}</span></td>
            <td>${row[4] || ''}</td>
            <td>${row[5] || ''}</td>
            <td>
                <div class="action-icons">
                    <button class="action-icon review" onclick="reviewLetter('${row[0]}')" title="مراجعة">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-icon print" onclick="printLetter('${row[0]}')" title="طباعة">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="action-icon download" onclick="downloadLetter('${row[0]}')" title="تحميل">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-icon delete" onclick="deleteLetter('${row[0]}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Load review letter options
function loadReviewLetterOptions() {
    const select = document.getElementById('review-letter-select');
    select.innerHTML = '<option value="">اختر خطاب</option>';
    
    if (!lettersData || lettersData.length <= 1) return;
    
    const headers = lettersData[0];
    const rows = lettersData.slice(1);
    
    rows.forEach(row => {
        const option = document.createElement('option');
        option.value = row[0];
        option.textContent = `${row[0]} - ${row[5]} - ${row[4]}`;
        select.appendChild(option);
    });
}

// Handle review letter selection
function handleReviewLetterSelection(event) {
    const letterId = event.target.value;
    if (!letterId) {
        document.getElementById('review-form').style.display = 'none';
        return;
    }
    
    const letterRow = lettersData.find(row => row[0] === letterId);
    if (letterRow) {
        document.getElementById('letter-review-content').value = letterRow[7] || '';
        document.getElementById('review-form').style.display = 'block';
    }
}

// Handle review checkbox
function handleReviewCheckbox(event) {
    const isChecked = event.target.checked;
    document.getElementById('needs-improvement').disabled = !isChecked;
    document.getElementById('ready-to-send').disabled = !isChecked;
    document.getElementById('rejected').disabled = !isChecked;
}

// Handle review action
async function handleReviewAction(status) {
    const letterId = document.getElementById('review-letter-select').value;
    const reviewerName = document.getElementById('reviewer-name').value;
    const notes = document.getElementById('review-notes').value;
    
    if (!reviewerName) {
        showNotification('يرجى إدخال اسم المراجع', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        // Here you would typically update the spreadsheet
        // For now, we'll just show a success message
        
        hideLoading();
        showNotification(`تم تحديث حالة الخطاب إلى: ${status}`, 'success');
        
        // Return to home page
        showPage('home');
        
    } catch (error) {
        console.error('Error updating review status:', error);
        hideLoading();
        showNotification('فشل في تحديث حالة المراجعة', 'error');
    }
}

// Search and filter functions
function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    filterTable();
}

function handleFilter() {
    filterTable();
}

function filterTable() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value;
    const reviewFilter = document.getElementById('review-filter').value;
    
    const rows = document.querySelectorAll('#letters-list tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 8) return;
        
        const id = cells[0].textContent.toLowerCase();
        const recipient = cells[5].textContent.toLowerCase();
        const type = cells[2].textContent;
        const reviewStatus = cells[3].textContent;
        
        const matchesSearch = id.includes(searchTerm) || recipient.includes(searchTerm);
        const matchesType = !typeFilter || type.includes(translateLetterType(typeFilter));
        const matchesReview = !reviewFilter || reviewStatus.includes(reviewFilter);
        
        row.style.display = matchesSearch && matchesType && matchesReview ? '' : 'none';
    });
}

// Action functions
function reviewLetter(letterId) {
    document.getElementById('review-letter-select').value = letterId;
    handleReviewLetterSelection({ target: { value: letterId } });
    showPage('review');
}

function printLetter(letterId) {
    // Implement print functionality
    window.print();
}

function downloadLetter(letterId) {
    // Implement download functionality
    const letterRow = lettersData.find(row => row[0] === letterId);
    if (letterRow) {
                const content = letterRow[7] || '';
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `letter_${letterId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

function deleteLetter(letterId) {
    if (confirm('هل أنت متأكد من حذف هذا الخطاب؟')) {
        // Implement delete functionality
        showNotification('تم حذف الخطاب بنجاح', 'success');
        loadLettersHistory();
    }
}

// Utility functions
function translateLetterType(type) {
    const translations = {
        'New': 'جديد',
        'Reply': 'رد',
        'Follow Up': 'متابعة',
        'Co-op': 'تعاون'
    };
    return translations[type] || type;
}

function getStatusClass(status) {
    switch (status) {
        case 'جاهز للإرسال':
        case 'تم الإرسال':
            return 'ready';
        case 'يحتاج إلى تحسينات':
        case 'مرفوض':
            return 'needs-improvement';
        default:
            return 'pending';
    }
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add notification styles if not exist
    if (!document.querySelector('.notification-styles')) {
        const style = document.createElement('style');
        style.className = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: var(--surface-color);
                border: 2px solid;
                border-radius: var(--border-radius);
                padding: 1rem;
                box-shadow: var(--shadow);
                z-index: 1000;
                animation: slideIn 0.3s ease;
                max-width: 400px;
            }
            
            .notification-success { border-color: var(--success-color); }
            .notification-error { border-color: var(--danger-color); }
            .notification-warning { border-color: var(--warning-color); }
            .notification-info { border-color: var(--primary-color); }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                margin-left: auto;
                color: var(--text-secondary);
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Add some sample data for testing
function addSampleData() {
    if (lettersData.length <= 1) {
        lettersData = [
            ['ID', 'Date', 'Type', 'Letter_Type', 'Recipient', 'Subject', 'Content', 'Generated_Content', 'Template', 'Review_Status', 'Send_Status'],
            ['550e8400-e29b-41d4-a716-446655440000', '2024-01-15', 'New', 'New', 'شركة التقنية المتطورة', 'طلب استفسار عن خدمات الشركة', 'محتوى الخطاب...', 'المحتوى المُنشأ...', '1', 'في الانتظار', 'في الانتظار'],
            ['550e8400-e29b-41d4-a716-446655440001', '2024-01-16', 'Reply', 'Reply', 'مؤسسة الأعمال', 'رد على استفسار سابق', 'محتوى الرد...', 'المحتوى المُنشأ...', '2', 'جاهز للإرسال', 'في الانتظار'],
            ['550e8400-e29b-41d4-a716-446655440002', '2024-01-17', 'Follow Up', 'Follow Up', 'شركة الخدمات', 'متابعة طلب سابق', 'محتوى المتابعة...', 'المحتوى المُنشأ...', '1', 'يحتاج إلى تحسينات', 'في الانتظار']
        ];
    }
}

// Initialize with sample data for testing
setTimeout(() => {
    addSampleData();
    if (document.getElementById('history-page').classList.contains('active')) {
        loadLettersHistory();
    }
}, 1000);

// Add this function for debugging
function addDebugButton() {
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Test API Connection';
    debugButton.className = 'btn btn-primary';
    debugButton.style.position = 'fixed';
    debugButton.style.top = '100px';
    debugButton.style.right = '20px';
    debugButton.style.zIndex = '9999';
    
    debugButton.onclick = async function() {
        const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/Settings?key=${CONFIG.API_KEY}`;
        console.log('Testing URL:', testUrl);
        
        try {
            const response = await fetch(testUrl);
            const data = await response.json();
            console.log('Test response:', data);
            alert('Check console for response data');
        } catch (error) {
            console.error('Test error:', error);
            alert('Error: ' + error.message);
        }
    };
    
    document.body.appendChild(debugButton);
}

// Add this function for testing the API connection
function addAPITestButton() {
    // Remove existing test button if any
    const existingButton = document.getElementById('api-test-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    const testButton = document.createElement('button');
    testButton.id = 'api-test-button';
    testButton.textContent = 'اختبار API';
    testButton.className = 'btn btn-warning';
    testButton.style.position = 'fixed';
    testButton.style.top = '120px';
    testButton.style.right = '20px';
    testButton.style.zIndex = '9999';
    
    testButton.onclick = async function() {
        const testData = {
            category: "طلب",
            sub_category: "استثمار وتشغيل مشتل",
            title: "طلب تعاون",
            recipient: "شركة نت زيرو",
            isFirst: true,
            prompt: "اكتب خطاب طلب تعاون مع شركة نت زيرو لاستثمار وتشغيل مشتل الي السيد علي محمد رائيس مجلس الاداؤه",
            tone: "رسمي"
        };
        
        console.log('Testing with data:', testData);
        
        try {
            showLoading();
            
            const response = await fetch(CONFIG.GENERATE_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(testData)
            });
            
            const responseText = await response.text();
            console.log('Test response status:', response.status);
            console.log('Test response text:', responseText);
            
            hideLoading();
            
            if (response.ok) {
                showNotification('اختبار API نجح!', 'success');
                alert('نجح الاختبار! تحقق من وحدة التحكم للحصول على التفاصيل');
            } else {
                showNotification(`فشل اختبار API: ${response.status}`, 'error');
                alert(`فشل الاختبار: ${response.status}\n${responseText}`);
            }
            
        } catch (error) {
            hideLoading();
            console.error('Test error:', error);
            showNotification('فشل اختبار API: ' + error.message, 'error');
            alert('خطأ في الاختبار: ' + error.message);
        }
    };
    
    document.body.appendChild(testButton);
}

function showLoading() {
    const loadingDiv = document.getElementById('loading');
    const loadingText = loadingDiv.querySelector('p');
    if (loadingText) {
        loadingText.textContent = 'جاري إنشاء الخطاب بواسطة AI... يرجى الانتظار';
    }
    loadingDiv.style.display = 'flex';
}

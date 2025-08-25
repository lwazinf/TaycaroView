// Telegram service configuration for your local n8n setup
const TELEGRAM_CONFIG = {
  individualWebhook: process.env.NEXT_PUBLIC_N8N_INDIVIDUAL_WEBHOOK || 'http://localhost:5678/webhook-test/telegram/individual',
  bulkWebhook: process.env.NEXT_PUBLIC_N8N_BULK_WEBHOOK || 'http://localhost:5678/webhook-test/telegram/bulk',
  callbackWebhook: process.env.NEXT_PUBLIC_N8N_CALLBACK_WEBHOOK || 'http://localhost:5678/webhook-test/telegram/callback',
  groupChatId: process.env.NEXT_PUBLIC_TELEGRAM_GROUP_CHAT_ID || '-1001234567890',
  botToken: process.env.TELEGRAM_BOT_TOKEN
};

export const sendIndividualTelegramMessage = async (
  studentTelegramId: string,
  title: string,
  message: string,
  announcementId: string,
  urgent: boolean = false
): Promise<any> => {
  try {
    console.log('🔄 Sending individual message to n8n:', TELEGRAM_CONFIG.individualWebhook);
    
    const payload = {
      studentTelegramId,
      title,
      message,
      announcementId,
      urgent,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Payload:', payload);
    
    const response = await fetch(TELEGRAM_CONFIG.individualWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Individual message response:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error sending individual Telegram message:', error);
    throw error;
  }
};

export const sendBulkTelegramAnnouncement = async (
  title: string,
  message: string,
  announcementId: string,
  targetAudience: string,
  targetLevels: string[],
  targetStudents: string[],
  urgent: boolean = false
): Promise<any> => {
  try {
    console.log('🔄 Sending bulk announcement to n8n:', TELEGRAM_CONFIG.bulkWebhook);
    
    const payload = {
      groupChatId: TELEGRAM_CONFIG.groupChatId,
      title,
      message,
      announcementId,
      targetAudience,
      targetLevels: targetLevels || [],
      targetStudents: targetStudents || [],
      urgent,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Payload:', payload);
    
    const response = await fetch(TELEGRAM_CONFIG.bulkWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Bulk announcement response:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error sending bulk Telegram announcement:', error);
    throw error;
  }
};

export const setupTelegramBot = async (): Promise<any> => {
  try {
    if (!TELEGRAM_CONFIG.botToken) {
      console.log('⚠️  No Telegram bot token configured');
      return { success: false, message: 'No bot token configured' };
    }

    // Set webhook for callback handling
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: TELEGRAM_CONFIG.callbackWebhook,
        allowed_updates: ['callback_query', 'message']
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Telegram webhook setup:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error setting up Telegram bot:', error);
    throw error;
  }
};
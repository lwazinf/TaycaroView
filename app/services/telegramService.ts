// Define response interfaces
interface TelegramIndividualResponse {
  success: boolean;
  message: string;
  telegramMessageId?: number;
  studentTelegramId?: string;
  error?: string;
}

interface TelegramBulkResponse {
  success: boolean;
  message: string;
  telegramMessageId?: number;
  targetCount?: number;
  error?: string;
}

interface TelegramBotSetupResponse {
  success: boolean;
  message: string;
  ok?: boolean;
  result?: boolean;
  description?: string;
  error_code?: number;
  error?: string; // Add this line
}

// Telegram service configuration for TaycaroView local n8n setup
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
): Promise<TelegramIndividualResponse> => {
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

    const result = await response.json() as TelegramIndividualResponse;
    console.log('✅ Individual message response:', result);
    
    return result;
  } catch (error: unknown) {
    console.error('❌ Error sending individual Telegram message:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: 'Failed to send individual message',
      error: errorMessage
    };
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
): Promise<TelegramBulkResponse> => {
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

    const result = await response.json() as TelegramBulkResponse;
    console.log('✅ Bulk announcement response:', result);
    
    return result;
  } catch (error: unknown) {
    console.error('❌ Error sending bulk Telegram announcement:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: 'Failed to send bulk announcement',
      error: errorMessage
    };
  }
};

export const setupTelegramBot = async (): Promise<TelegramBotSetupResponse> => {
  try {
    if (!TELEGRAM_CONFIG.botToken) {
      console.log('⚠️  No Telegram bot token configured');
      return { 
        success: false, 
        message: 'No bot token configured' 
      };
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

    const result = await response.json() as Record<string, unknown>;
    console.log('✅ Telegram webhook setup:', result);
    
    return {
      success: result.ok as boolean || false,
      message: result.description as string || 'Webhook setup completed',
      ok: result.ok as boolean,
      result: result.result as boolean,
      description: result.description as string,
      error_code: result.error_code as number
    };
  } catch (error: unknown) {
    console.error('❌ Error setting up Telegram bot:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: 'Failed to setup Telegram bot',
      error: errorMessage
    };
  }
};
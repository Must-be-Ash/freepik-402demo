import { NextRequest, NextResponse } from 'next/server';
import { storeTaskResult, getTaskResult } from '@/lib/task-store';
import { validateWebhook } from '@/lib/webhook-security';

export async function POST(request: NextRequest) {
  try {
    console.log('Freepik webhook received');
    
    // Get webhook headers for security verification
    const webhookId = request.headers.get('webhook-id');
    const webhookTimestamp = request.headers.get('webhook-timestamp');
    const webhookSignature = request.headers.get('webhook-signature');
    
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook authenticity if secret is configured
    const webhookSecret = process.env.FREEPIK_WEBHOOK_SECRET;
    if (webhookSecret && webhookId && webhookTimestamp && webhookSignature) {
      const validation = validateWebhook(webhookId, webhookTimestamp, webhookSignature, rawBody, webhookSecret);
      
      if (!validation.valid) {
        console.error('Webhook validation failed:', validation.error);
        return NextResponse.json({ error: 'Webhook validation failed' }, { status: 401 });
      }
      
      console.log('Webhook signature verified successfully');
    } else {
      console.warn('Webhook security headers missing or secret not configured - skipping validation');
    }
    
    // Parse the JSON body
    const body = JSON.parse(rawBody);
    console.log('Webhook payload:', JSON.stringify(body, null, 2));
    
    // Extract task information from Freepik webhook
    const { task_id, status, generated, data } = body;
    
    if (!task_id) {
      console.error('No task_id in webhook payload');
      return NextResponse.json({ error: 'No task_id provided' }, { status: 400 });
    }
    
    // Store the result
    storeTaskResult(task_id, {
      task_id,
      status,
      generated: generated || data?.generated || [],
      payload: body
    });
    
    console.log(`Stored result for task ${task_id} with status ${status}`);
    
    // Log generated images if any
    if (generated && generated.length > 0) {
      console.log(`Generated ${generated.length} image(s) for task ${task_id}`);
      console.log('Generated images:', generated);
    }
    
    return NextResponse.json({ success: true, received: task_id });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// GET endpoint to check task results
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const task_id = searchParams.get('task_id');
  
  if (!task_id) {
    return NextResponse.json({ error: 'task_id parameter required' }, { status: 400 });
  }
  
  const result = getTaskResult(task_id);
  
  if (!result) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  
  return NextResponse.json(result);
}

// Note: Helper functions moved to separate module to avoid Next.js route export issues
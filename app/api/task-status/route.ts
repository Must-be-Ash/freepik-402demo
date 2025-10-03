import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const task_id = searchParams.get('task_id');
  
  if (!task_id) {
    return NextResponse.json({ error: 'task_id parameter required' }, { status: 400 });
  }
  
  // Check Freepik API key
  const freepikApiKey = process.env.FREEPIK_API_KEY;
  if (!freepikApiKey) {
    return NextResponse.json({ error: 'Freepik API key not configured' }, { status: 500 });
  }
  
  try {
    console.log(`Checking status for task: ${task_id}`);
    
    // Call Freepik API to get task status
    // Note: The correct endpoint is /v1/ai/mystic/{task_id}, not /v1/ai/mystic/task/{task_id}
    const response = await axios.get(
      `https://api.freepik.com/v1/ai/mystic/${task_id}`,
      {
        headers: {
          'x-freepik-api-key': freepikApiKey,
        },
      }
    );
    
    console.log(`Task ${task_id} status response:`, response.data);
    
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error(`Error checking task ${task_id}:`, error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;
      
      return NextResponse.json(
        { 
          error: 'Freepik API error',
          message: message,
          status: status,
          task_id
        },
        { status: status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to check task status', task_id },
      { status: 500 }
    );
  }
}
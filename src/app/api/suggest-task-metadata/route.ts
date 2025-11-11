import { NextRequest, NextResponse } from 'next/server';
import { multiProviderAI } from '@/lib/ai/multi-provider';

export async function POST(request: NextRequest) {
  try {
    const { taskText } = await request.json();

    if (!taskText) {
      return NextResponse.json(
        { error: 'Task text is required' },
        { status: 400 }
      );
    }

    // Generate AI suggestions
    const currentDate = new Date();
    const prompt = `You are a task management assistant. Analyze the following task and extract/generate:
1. Clean task name (remove dates and times, clean up text)
2. Description (1-2 sentences)
3. Tags (2-4 relevant tags)
4. Due date with TIME (if mentioned: "tomorrow", "next Monday", "Dec 5", "at 5pm", "by 3:30pm", etc.)

Task: "${taskText}"

Current date and time: ${currentDate.toISOString()}
(That's ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${currentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })})

Respond ONLY with a JSON object in this exact format:
{
  "cleanTaskName": "Clean task name without dates or times",
  "description": "Brief description here",
  "tags": ["tag1", "tag2", "tag3"],
  "dueDate": "2025-12-05T17:00:00.000Z" or null
}

CRITICAL TIME EXTRACTION RULES (PAY CLOSE ATTENTION):
- Look for these patterns: "at X", "by X", "X pm", "X am", "Xpm", "Xam"
- Examples of PM times (afternoon/evening):
  * "1pm" or "1 pm" or "at 1pm" → 13:00
  * "2pm" or "2 pm" → 14:00
  * "3pm" or "3 pm" → 15:00
  * "5pm" or "5 pm" or "by 5pm" → 17:00
  * "11pm" or "11 pm" → 23:00
  * "12pm" or "noon" → 12:00
- Examples of AM times (morning):
  * "1am" or "1 am" → 01:00
  * "8am" or "8 am" → 08:00
  * "9am" or "9 am" → 09:00
  * "12am" or "midnight" → 00:00
- With minutes:
  * "3:30pm" → 15:30
  * "2:45pm" → 14:45
  * "9:15am" → 09:15
- If NO time mentioned → set to 10:00 (10 AM default)
- ALWAYS use 24-hour format in ISO 8601: HH:00:00.000Z

OTHER RULES:
- cleanTaskName: Remove ALL date and time references, make it clear and concise
- tags: lowercase, relevant (work, personal, urgent, important, homework, etc.)
- dueDate: ISO 8601 format, calculate from current date if relative (tomorrow, next week, etc.)
- If no date/time mentioned, set dueDate to null`;

    const response = await multiProviderAI.generateResponse([
      { role: 'user', content: prompt }
    ]);

    // Parse the AI response
    let suggestions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create a simple response
        suggestions = {
          cleanTaskName: taskText,
          description: response.text.substring(0, 150),
          tags: [],
          dueDate: null
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback suggestions
      suggestions = {
        cleanTaskName: taskText,
        description: `Task: ${taskText}`,
        tags: ['task'],
        dueDate: null
      };
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}


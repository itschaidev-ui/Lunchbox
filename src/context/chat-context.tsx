'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message } from '@/ai/flows/chat';

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: any;
  updatedAt: any;
}

interface ChatContextType {
  messages: Message[];
  currentChat: Chat | null;
  savedChats: Chat[];
  loading: boolean;
  createNewChat: (title: string) => Promise<string>;
  saveCurrentChat: () => Promise<void>;
  addMessage: (message: Message) => Promise<Message[]>;
  deleteChat: (chatId: string) => Promise<void>;
  exportChat: () => void;
  clearChat: () => void;
  loadChat: (chatId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [savedChats, setSavedChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load saved chats for authenticated users
  useEffect(() => {
    if (!user) {
      setSavedChats([]);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      setSavedChats(chats);
    });

    return () => unsubscribe();
  }, [user]);

  const createNewChat = async (title: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const chatData = {
      title,
      messages: [],
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'chats'), chatData);
    const newChat: Chat = {
      id: docRef.id,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setCurrentChat(newChat);
    setMessages([]);
    return docRef.id;
  };

  const saveCurrentChat = async (): Promise<void> => {
    if (!user || !currentChat) throw new Error('No active chat to save');

    const chatRef = doc(db, 'chats', currentChat.id);
    await updateDoc(chatRef, {
      messages,
      updatedAt: serverTimestamp()
    });
  };

  const addMessage = async (message: Message): Promise<Message[]> => {
    return new Promise((resolve) => {
      setMessages(prev => {
        const updatedMessages = [...prev, message];
        
        // Update Firebase asynchronously
        if (currentChat && user) {
          const chatRef = doc(db, 'chats', currentChat.id);
          updateDoc(chatRef, {
            messages: updatedMessages,
            updatedAt: serverTimestamp()
          }).catch(error => {
            console.error('Error updating chat in Firebase:', error);
          });
        }
        
        resolve(updatedMessages);
        return updatedMessages;
      });
    });
  };

  const deleteChat = async (chatId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(db, 'chats', chatId));
    
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
      setMessages([]);
    }
  };

  const exportChat = (): void => {
    if (messages.length === 0) return;

    const chatText = messages.map(msg => {
      const role = msg.role === 'user' ? 'You' : 'Assistant';
      const content = Array.isArray(msg.content) 
        ? msg.content.map(c => c.text).join('')
        : msg.content;
      return `${role}: ${content}`;
    }).join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearChat = (): void => {
    setMessages([]);
    setCurrentChat(null);
  };

  const loadChat = async (chatId: string): Promise<void> => {
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      // Save current chat if it has messages and is different from the one being loaded
      if (currentChat && currentChat.id !== chatId && messages.length > 0) {
        try {
          await saveCurrentChat();
        } catch (error) {
          console.error('Error saving current chat before loading new one:', error);
        }
      }
      
      setCurrentChat(chat);
      setMessages(chat.messages);
    }
  };

  return (
    <ChatContext.Provider value={{
      messages,
      currentChat,
      savedChats,
      loading,
      createNewChat,
      saveCurrentChat,
      addMessage,
      deleteChat,
      exportChat,
      clearChat,
      loadChat
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

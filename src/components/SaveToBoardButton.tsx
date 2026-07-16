'use client';
import { useState, useEffect } from 'react';
import { Board, getBoards, createBoard, savePinToBoard } from '@/lib/db';
import { ImageObj } from '@/app/page';

interface SaveToBoardButtonProps {
  pin: ImageObj;
}

export default function SaveToBoardButton({ pin }: SaveToBoardButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getBoards().then(setBoards).catch(console.error);
    }
  }, [isOpen]);

  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      const board = await createBoard(newBoardName.trim());
      await savePinToBoard(board.id, pin);
      setIsOpen(false);
      setNewBoardName('');
    } catch(err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToExisting = async (boardId: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await savePinToBoard(boardId, pin);
      setIsOpen(false);
    } catch(err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button 
        className="save-btn" 
        style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '24px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }}
        onClick={() => setIsOpen(true)}
      >
        Save to Board
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(8px)'
        }} onClick={(e) => {
           if (e.target === e.currentTarget) setIsOpen(false);
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px',
            width: '90%', maxWidth: '450px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg)', border: 'none', color: 'var(--text-primary)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              &times;
            </button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)', textAlign: 'center' }}>Save to Board</h2>
            
            <form onSubmit={handleCreateAndSave} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
              <input 
                type="text" 
                placeholder="Create new board..." 
                value={newBoardName}
                onChange={e => setNewBoardName(e.target.value)}
                style={{ flex: 1, padding: '14px 20px', borderRadius: '16px', border: '2px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }}
                autoFocus
                onFocus={e => e.target.style.borderColor = 'var(--text-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button 
                type="submit" 
                disabled={!newBoardName.trim() || isSaving}
                style={{ padding: '0 24px', borderRadius: '16px', background: 'var(--accent)', color: 'white', fontWeight: 600, fontSize: '1rem', border: 'none', cursor: 'pointer', opacity: newBoardName.trim() ? 1 : 0.5, transition: 'opacity 0.2s' }}
              >
                Create
              </button>
            </form>

            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '16px', fontWeight: 600 }}>All Boards</h3>
            {boards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', background: 'var(--bg)', borderRadius: '16px', fontStyle: 'italic' }}>
                No boards created yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                {boards.map(board => {
                  const isSaved = board.pins.some(p => p.id === pin.id);
                  return (
                    <div 
                      key={board.id} 
                      onClick={() => !isSaved && handleSaveToExisting(board.id)}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        padding: '16px', borderRadius: '16px', 
                        background: 'var(--bg)', cursor: isSaved ? 'default' : 'pointer',
                        opacity: isSaved ? 0.7 : 1, transition: 'all 0.2s',
                        border: '1px solid transparent'
                      }}
                      onMouseOver={e => !isSaved && (e.currentTarget.style.border = '1px solid var(--border)')}
                      onMouseOut={e => !isSaved && (e.currentTarget.style.border = '1px solid transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--border)', overflow: 'hidden' }}>
                           {board.pins[0] && <img src={board.pins[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{board.name}</span>
                      </div>
                      <button 
                        style={{ 
                          background: isSaved ? 'transparent' : 'var(--accent)', 
                          color: isSaved ? 'var(--text-primary)' : 'white', 
                          border: isSaved ? 'none' : 'none', 
                          borderRadius: '24px', padding: '8px 20px', 
                          fontWeight: 600, cursor: isSaved ? 'default' : 'pointer',
                          fontSize: '0.95rem'
                        }}
                      >
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

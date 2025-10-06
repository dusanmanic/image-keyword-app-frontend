import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";
import { useFoldersRedux } from "../hooks/useFoldersRedux.js";


const Container = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
  padding: 20px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 40px 20px;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
`;

const EmptyTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
`;

const EmptyMessage = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  max-width: 400px;
  line-height: 1.5;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Title = styled.h1`
  color: #1e40af;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #e5e7eb;
  background: transparent;
  border-radius: 8px;
  width: 260px;
  color: #1e40af;

  &::placeholder { color: #9ca3af; font-family: 'Nunito Sans'; font-size: 14px; }
  &::-webkit-input-placeholder { color: #9ca3af; font-family: 'Nunito Sans'; font-size: 14px; }
  &::-moz-placeholder { color: #9ca3af; opacity: 1; font-family: 'Nunito Sans'; font-size: 14px; }
  &:-ms-input-placeholder { color: #9ca3af; font-family: 'Nunito Sans'; font-size: 14px; }
  &::-ms-input-placeholder { color: #9ca3af; font-family: 'Nunito Sans'; font-size: 14px; }

  /* Date input tweaks */
  &[type='date'] {
    color-scheme: light;
    background: transparent;
  }
  /* Default (empty) date fields look like placeholder */
  &[type='date']::-webkit-datetime-edit {
    color: #9ca3af;
    font-family: 'Nunito Sans';
    font-size: 14px;
  }
  /* When it has a value, use main text color */
  &[type='date']:not([value=""])::-webkit-datetime-edit {
    color: #1e40af;
    font-family: 'Nunito Sans';
    font-size: 14px;
  }
  /* Show calendar icon and make it visible */
  &[type='date']::-webkit-calendar-picker-indicator {
    opacity: 1;
    display: block;
    cursor: pointer;
    filter: invert(16%) sepia(83%) saturate(958%) hue-rotate(205deg) brightness(90%) contrast(95%);
  }

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
    background: transparent;
  }
`;

const Button = styled.button`
  background: #2563eb;
  color: white;
  font-weight: 600;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  &:hover { background: #1d4ed8; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }

  ${props => props.$danger && `
    background: #ef4444;
    border: none;
    color: white;
    &:hover { background: #c83e3e; }
  `}

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;

const CardTitle = styled.div`
  color: #1e40af;
  font-weight: 700;
`;

const Text = styled.div`
  color: #6b7280;
  font-size: ${props => props.$size || '12px'};
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ModalCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  width: 90vw;
  max-width: 720px;
  padding: 16px;
`;

const ModalTitle = styled.h2`
  color: #1e40af;
  font-size: 18px;
  margin: 0 0 12px;
`;

const ModalRow = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
`;

const Label = styled.label`
  color: #1e40af;
  font-weight: 600;
`;

const TextArea = styled.textarea`
  background: transparent;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-height: 80px;
  resize: none;
  color: #1e40af;
  font-family: 'Nunito Sans';
  font-size: 14px;

  &::placeholder { color: #9ca3af; font-size: 14px; font-family: 'Nunito Sans'; }
  &::-webkit-input-placeholder { color: #9ca3af; font-size: 14px; font-family: 'Nunito Sans'; }
  &::-moz-placeholder { color: #9ca3af; opacity: 1; font-size: 14px; font-family: 'Nunito Sans'; }
  &:-ms-input-placeholder { color: #9ca3af; font-size: 14px; font-family: 'Nunito Sans'; }
  &::-ms-input-placeholder { color: #9ca3af; font-size: 14px; font-family: 'Nunito Sans'; }

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;

 

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: #1e40af;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  &:hover { background: #eff6ff; }
  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
    background: transparent;
  }
`;

const FolderIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="#1e40af" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z"/>
  </svg>
);

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1e40af" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

const RowCard = styled.div`
  position: relative;
  width: 350px;
  height: 208px;
  background: ${props => props.$cardBg || '#ffffff'};
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: box-shadow 120ms ease, transform 120ms ease, border-color 120ms ease;

  &:hover {
    border-color: #e5e7eb;
    box-shadow: 0 8px 22px rgba(0,0,0,0.12);
    transform: translateY(-1px);
  }
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, 380px);
  gap: 12px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  justify-content: center;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CardSection = styled.div`
  display: flex;
  flex-direction: column;
  height: 50px;
`;

const TagSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  height: 40px;
  align-items: center;
`;

const CardBody = styled.div`
  margin-top: 4px;
  display: flex;
  flex-direction: column;
`;

const Clamp = styled(Text)`
  display: -webkit-box;
  -webkit-line-clamp: ${props => props.$lines || 3};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 12px;
  background: #eff6ff;
  color: #1e40af;
  font-weight: 700;
  font-size: 12px;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => props.$bgColor || '#f3f4f6'};
  color: ${props => props.$textColor || '#6b7280'};
  border: 1px solid ${props => props.$borderColor || '#e5e7eb'};
`;

const TagSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
`;

const TagOption = styled.button`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 2px solid ${props => props.$isSelected ? props.$borderColor : '#e5e7eb'};
  background: ${props => props.$isSelected ? props.$bgColor : 'white'};
  color: ${props => props.$isSelected ? props.$textColor : '#6b7280'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.$borderColor};
    background: ${props => props.$bgColor};
    color: ${props => props.$textColor};
  }

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;

const ColorPalette = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
`;

const ColorOption = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid ${props => props.$isSelected ? '#1e40af' : '#e5e7eb'};
  background: ${props => props.$color || '#ffffff'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    border-color: #1e40af;
  }

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;

const IconBox = styled.div`
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconBadge = styled(Badge)`
  position: absolute;
  bottom: 16px;
`;

const FloatingActionButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 54px;
  height: 54px;
  background: #1e40af;
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  transition: all 0.2s ease;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #1d4ed8;
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(30, 64, 175, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;

// Tag definitions with colors
const FOLDER_TAGS = {
  nature: {
    label: 'Nature',
    bgColor: '#dcfce7',
    textColor: '#166534',
    borderColor: '#bbf7d0',
    cardBg: '#f0fdf4' // Pastel green
  },
  medical: {
    label: 'Medical',
    bgColor: '#fef2f2',
    textColor: '#991b1b',
    borderColor: '#fecaca',
    cardBg: '#fef7f7' // Pastel red
  },
  business: {
    label: 'Business',
    bgColor: '#eff6ff',
    textColor: '#1e40af',
    borderColor: '#dbeafe',
    cardBg: '#f8fafc' // Pastel blue
  },
  travel: {
    label: 'Travel',
    bgColor: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#fde68a',
    cardBg: '#fffbeb' // Pastel yellow
  },
  art: {
    label: 'Art',
    bgColor: '#f3e8ff',
    textColor: '#7c3aed',
    borderColor: '#e9d5ff',
    cardBg: '#faf5ff' // Pastel purple
  },
  food: {
    label: 'Food',
    bgColor: '#fef7ed',
    textColor: '#ea580c',
    borderColor: '#fed7aa',
    cardBg: '#fff7ed' // Pastel orange
  },
  technology: {
    label: 'Tech',
    bgColor: '#f0fdf4',
    textColor: '#15803d',
    borderColor: '#dcfce7',
    cardBg: '#f0fdf4' // Pastel mint
  }
};

// Available folder colors
const FOLDER_COLORS = [
  { name: 'white', color: '#ffffff', label: 'White' },
  { name: 'green', color: '#f0fdf4', label: 'Green' },
  { name: 'red', color: '#fef7f7', label: 'Red' },
  { name: 'blue', color: '#f8fafc', label: 'Blue' },
  { name: 'yellow', color: '#fffbeb', label: 'Yellow' },
  { name: 'purple', color: '#faf5ff', label: 'Purple' },
  { name: 'orange', color: '#fff7ed', label: 'Orange' },
  { name: 'mint', color: '#f0fdf4', label: 'Mint' }
];

export default function FoldersPage() {
  const [counts, setCounts] = useState({});
  const [selectedId, setSelectedId] = useState(null);
 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', shootingDate: '', notes: '', tags: [], color: 'white' });
  const navigate = useNavigate();
  
  // Folders are loaded globally in MainApp
  const { folders, setFolders, saveFolder, deleteFolder } = useFoldersRedux();

  useEffect(() => {
    (async () => {
      const out = {};
      try {
        // Use existing count if present on folder, else 0
        (folders || []).forEach((f) => {
          const existing = typeof f.imagesCount === 'number' ? f.imagesCount : 0;
          out[f.id] = existing;
        });
      } catch {}
      setCounts(out);
    })();
  }, [folders]);


  const openFolder = (id) => navigate(`/import/${id}`);

  const openCreateModal = () => {
    setSelectedId(null);
    setDraft({ title: '', description: '', shootingDate: '', notes: '', tags: [], color: 'white' });
    setIsModalOpen(true);
  };

  const openEditModal = (id) => {
    const targetId = id || selectedId;
    if (!targetId) return;
    const f = folders.find(x => x.id === targetId);
    if (!f) return;
    setSelectedId(targetId);
    setDraft({
      title: f.name || '',
      description: f.description || '',
      shootingDate: f.shootingDate || '',
      notes: f.notes || '',
      tags: f.tags || [],
      color: f.color || 'white',
    });
    setIsModalOpen(true);
  };

  const handleDeleteFolder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this folder? This will also delete all images in the folder.')) {
      return;
    }
    
    try {
      await deleteFolder(id);
      setIsModalOpen(false);
      alert('Folder deleted successfully!');
    } catch (error) {
      alert('Failed to delete folder: ' + error.message);
    }
  };

  const saveMetadata = async () => {
    const trimmedTitle = (draft.title || '').trim();
    if (!selectedId) {
      // Check for duplicate folder names
      const existingFolder = folders.find(f => f.name.toLowerCase() === trimmedTitle.toLowerCase());
      if (existingFolder) {
        alert(`A folder with the name "${trimmedTitle}" already exists. Please choose a different name.`);
        return;
      }
      
      const newFolder = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        name: trimmedTitle || 'Untitled',
        createdAt: Date.now(),
        description: (draft.description || '').trim(),
        shootingDate: draft.shootingDate || '',
        notes: (draft.notes || '').trim(),
        tags: draft.tags || [],
        color: draft.color || 'white',
      };
      
      try {
        const savedFolder = await saveFolder(newFolder);
        // Update local folders state
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error saving folder:', error);
      }
      return;
    }
    
    // Check for duplicate folder names when editing (exclude current folder)
    const existingFolder = folders.find(f => f.id !== selectedId && f.name.toLowerCase() === trimmedTitle.toLowerCase());
    if (existingFolder) {
      alert(`A folder with the name "${trimmedTitle}" already exists. Please choose a different name.`);
      return;
    }
    
    const updatedFolder = {
      ...folders.find(f => f.id === selectedId),
      name: trimmedTitle,
      description: (draft.description || '').trim(),
      shootingDate: draft.shootingDate || '',
      notes: (draft.notes || '').trim(),
      tags: draft.tags || [],
      color: draft.color || 'white',
    };
    
    try {
      const savedFolder = await saveFolder(updatedFolder, true);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating folder:', error);
    }
  };

  const formatDate = (val) => {
    if (!val) return '';
    try { return new Date(val).toLocaleDateString(); } catch { return val; }
  };

  const toggleTag = (tagKey) => {
    setDraft(d => {
      const currentTags = d.tags || [];
      if (currentTags.includes(tagKey)) {
        // Remove tag
        return { ...d, tags: currentTags.filter(t => t !== tagKey) };
      } else if (currentTags.length < 3) {
        // Add tag (max 3)
        return { ...d, tags: [...currentTags, tagKey] };
      }
      return d; // Don't add if already at max
    });
  };

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Header content can be added here if needed */}
        </div>
      </Header>
      {folders?.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📁</EmptyIcon>
          <EmptyTitle>No folders yet</EmptyTitle>
          <EmptyMessage>Create your first folder to add images</EmptyMessage>
          <div style={{ marginTop: 16 }}>
            <Button onClick={openCreateModal}>Create folder</Button>
          </div>
        </EmptyState>
      ) : (
        <CardsGrid>
        {folders?.map(f => {
          return (
            <RowCard 
              key={f.id} 
              onClick={() => openFolder(f.id)}
              $cardBg={f.color ? FOLDER_COLORS.find(c => c.name === f.color)?.color || '#ffffff' : '#ffffff'}
            >
              <CardHeader>
                <CardLeft>
                  <IconBox>
                    <FolderIcon />
                    <IconBadge title="Files in folder">{f.imageCount ?? 0}</IconBadge>
                  </IconBox>
                  <div>
                    <CardTitle>{f.name}</CardTitle>
                    <Text>{formatDate(f.shootingDate)}</Text>
                  </div>
                </CardLeft>
                <IconButton onClick={(e) => { e.stopPropagation(); openEditModal(f.id); }} title="Edit">
                  <PencilIcon />
                </IconButton>
              </CardHeader>
              <CardBody>
                {/* Tags Section - Always reserved space */}
                <TagSection>
                  {f.tags && f.tags.length > 0 ? (
                    f.tags.map(tagKey => 
                      FOLDER_TAGS[tagKey] && (
                        <Tag 
                          key={tagKey}
                          $bgColor={FOLDER_TAGS[tagKey].bgColor}
                          $textColor={FOLDER_TAGS[tagKey].textColor}
                          $borderColor={FOLDER_TAGS[tagKey].borderColor}
                        >
                          {FOLDER_TAGS[tagKey].label}
                        </Tag>
                      )
                    )
                  ) : (
                    <Text $size="12px" style={{ color: '#9ca3af', fontStyle: 'italic' }}>No categories</Text>
                  )}
                </TagSection>
                
                {/* Description Section - Always reserved space */}
                <CardSection>
                  <Text $size="14px" style={{ color: '#1e40af', fontWeight: 600 }}>Description</Text>
                  {f.description ? (
                    <Clamp $size="15px" $lines={1}>{f.description}</Clamp>
                  ) : (
                    <Text $size="12px" style={{ color: '#9ca3af', fontStyle: 'italic' }}>No description</Text>
                  )}
                </CardSection>
                
                {/* Notes Section - Always reserved space */}
                <CardSection>
                  <Text $size="14px" style={{ color: '#1e40af', fontWeight: 600 }}>Notes</Text>
                  {f.notes ? (
                    <Clamp $size="15px" $lines={1}>{f.notes}</Clamp>
                  ) : (
                    <Text $size="12px" style={{ color: '#9ca3af', fontStyle: 'italic' }}>No notes</Text>
                  )}
                </CardSection>
              </CardBody>
            </RowCard>
          )
        })}
        </CardsGrid>
      )}

      {isModalOpen && (
        <ModalOverlay onClick={()=> setIsModalOpen(false)}>
          <ModalCard onClick={(e)=> e.stopPropagation()}>
            <ModalTitle>{selectedId ? 'Edit folder metadata' : 'Create new folder'}</ModalTitle>
            <ModalRow>
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e)=> setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Folder title" />
            </ModalRow>
            <ModalRow>
              <Label>Description</Label>
              <TextArea 
                value={draft.description}
                onChange={(e)=> {
                  const next = (e.target.value || '').slice(0, 400);
                  setDraft(d => ({ ...d, description: next }))
                }}
                placeholder="Brief set summary to improve assistant (no per-photo), e.g. shooting place, number of people, nationality"
                maxLength={400}
              />
            <div style={{ position: 'absolute', bottom: 0, right: 5 }}>
                <Text style={{ color: '#9ca3af', marginTop: 4 }}>{(draft.description || '').length}/400</Text>
            </div>
            </ModalRow>
            <ModalRow>
              <Label>Shooting date</Label>
              <Input type="date" value={draft.shootingDate} onChange={(e)=> setDraft(d => ({ ...d, shootingDate: e.target.value }))} />
            </ModalRow>
            <ModalRow>
              <Label>Additional notes</Label>
              <TextArea value={draft.notes} onChange={(e)=> setDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Notes" />
            </ModalRow>
            <ModalRow>
              <Label>Categories (max 3)</Label>
              <div>
                <TagSelector>
                  {Object.entries(FOLDER_TAGS).map(([key, tag]) => (
                    <TagOption
                      key={key}
                      $isSelected={draft.tags && draft.tags.includes(key)}
                      $bgColor={tag.bgColor}
                      $textColor={tag.textColor}
                      $borderColor={tag.borderColor}
                      onClick={() => toggleTag(key)}
                      style={{ 
                        opacity: (draft.tags && draft.tags.length >= 3 && !draft.tags.includes(key)) ? 0.5 : 1,
                        cursor: (draft.tags && draft.tags.length >= 3 && !draft.tags.includes(key)) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {tag.label}
                    </TagOption>
                  ))}
                </TagSelector>
                <Text $size="12px" style={{ color: '#6b7280', marginTop: '4px' }}>
                  {draft.tags ? draft.tags.length : 0}/3 selected
                </Text>
              </div>
            </ModalRow>
            <ModalRow>
              <Label>Folder Color</Label>
              <div>
                <ColorPalette>
                  {FOLDER_COLORS.map((colorOption) => (
                    <ColorOption
                      key={colorOption.name}
                      $color={colorOption.color}
                      $isSelected={draft.color === colorOption.name}
                      onClick={() => setDraft(d => ({ ...d, color: colorOption.name }))}
                      title={colorOption.label}
                    />
                  ))}
                </ColorPalette>
              </div>
            </ModalRow>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {selectedId && (<Button onClick={() => handleDeleteFolder(selectedId)} $danger>🗑️ Delete Folder</Button>)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={saveMetadata}>{selectedId ? 'Save' : 'Create'}</Button>
                <Button onClick={()=> setIsModalOpen(false)} style={{ background: 'white', color: '#1e40af' }}>Cancel</Button>
              </div>
            </div>
          </ModalCard>
        </ModalOverlay>
      )}
      
      {folders?.length > 0 && (
        <FloatingActionButton onClick={openCreateModal} title="Create new folder">
          +
        </FloatingActionButton>
      )}
    </Container>
  );
}

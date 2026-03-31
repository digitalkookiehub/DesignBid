import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle2, Home, Palette, DoorOpen, HardHat } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { useClients } from '@/hooks/useClients';
import { useCreateProject, useAddRoom } from '@/hooks/useProjects';
import { useLabours } from '@/hooks/useLabours';
import { assignLabour } from '@/services/labourService';
import type { ProjectCreate, RoomCreate, RoomType, ProjectType } from '@/types/project';
import type { Labour } from '@/types/labour';

const STYLE_OPTIONS = ['Modern', 'Contemporary', 'Traditional', 'Minimalist', 'Industrial', 'Scandinavian'];

const ROOM_TYPES: { label: string; value: RoomType }[] = [
  { label: 'Bedroom', value: 'bedroom' },
  { label: 'Kitchen', value: 'kitchen' },
  { label: 'Bathroom', value: 'bathroom' },
  { label: 'Living', value: 'living' },
  { label: 'Dining', value: 'dining' },
  { label: 'Study', value: 'study' },
  { label: 'Balcony', value: 'balcony' },
  { label: 'Pooja', value: 'pooja' },
  { label: 'Utility', value: 'utility' },
  { label: 'Other', value: 'other' },
];

interface RoomDraft extends RoomCreate {
  _key: number;
}

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [clientId, setClientId] = useState<number>(0);
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('residential');
  const [address, setAddress] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  // Step 2
  const [styles, setStyles] = useState<string[]>([]);
  const [familySize, setFamilySize] = useState('');
  const [specialReqs, setSpecialReqs] = useState('');

  // Step 3
  const [rooms, setRooms] = useState<RoomDraft[]>([]);
  const [roomForm, setRoomForm] = useState<RoomDraft>(defaultRoom());

  // Step 4 - Labour
  const [selectedLabours, setSelectedLabours] = useState<{ labour: Labour; role: string }[]>([]);

  const { data: clientData } = useClients(1, '');
  const clients = clientData?.items ?? [];
  const { data: allLabours } = useLabours();
  const labourList = allLabours ?? [];

  const createProject = useCreateProject();
  const addRoom = useAddRoom();

  function defaultRoom(): RoomDraft {
    return {
      _key: Date.now(),
      name: '',
      room_type: 'bedroom',
      length: 0,
      width: 0,
      height: 10,
      electrical_points: 0,
      plumbing_points: 0,
      windows_count: 0,
      doors_count: 0,
      has_false_ceiling: false,
      has_flooring_work: false,
      has_painting: false,
      has_carpentry: false,
    };
  }

  const roomArea = roomForm.length * roomForm.width;
  const roomWallArea = 2 * (roomForm.length + roomForm.width) * (roomForm.height ?? 10);

  function toggleStyle(s: string) {
    setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function addRoomToList() {
    if (!roomForm.name || roomForm.length <= 0 || roomForm.width <= 0) return;
    setRooms((prev) => [...prev, { ...roomForm, _key: Date.now() }]);
    setRoomForm(defaultRoom());
  }

  function removeRoom(key: number) {
    setRooms((prev) => prev.filter((r) => r._key !== key));
  }

  async function handleSubmit() {
    const projectData: ProjectCreate = {
      client_id: clientId,
      name,
      project_type: projectType,
      address: address || undefined,
      total_area_sqft: totalArea ? Number(totalArea) : undefined,
      budget_min: budgetMin ? Number(budgetMin) : undefined,
      budget_max: budgetMax ? Number(budgetMax) : undefined,
      style_preferences: styles,
      family_size: familySize ? Number(familySize) : undefined,
      special_requirements: specialReqs || undefined,
    };

    const project = await createProject.mutateAsync(projectData);

    for (const room of rooms) {
      const { _key, ...roomData } = room;
      await addRoom.mutateAsync({ projectId: project.id, data: roomData });
    }

    // Assign selected labourers
    for (const sl of selectedLabours) {
      try {
        await assignLabour(project.id, { labour_id: sl.labour.id, role: sl.role || undefined });
      } catch {
        // Continue even if one assignment fails
      }
    }

    navigate(`/projects/${project.id}`);
  }

  const canProceedStep1 = clientId > 0 && name.trim().length > 0;
  const isSubmitting = createProject.isPending || addRoom.isPending;

  const stepIcons = [Home, Palette, DoorOpen, HardHat];

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Project</h1>
        <p className="text-gray-500 mb-8">Fill in the details to set up your interior design project</p>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3, 4].map((s) => {
            const Icon = stepIcons[s - 1];
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step === s
                      ? 'bg-blue-600 text-white shadow-lg'
                      : step > s
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <GlassCard>
                <h2 className="text-lg font-semibold mb-6">Project Basics</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Client</label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-sm"
                    >
                      <option value={0}>Select a client...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <AnimatedInput label="Project Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Villa Interior 3BHK" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Type</label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value as ProjectType)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-sm"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                  <AnimatedInput label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Project site address" />
                  <AnimatedInput label="Total Area (sqft)" type="number" value={totalArea} onChange={(e) => setTotalArea(e.target.value)} placeholder="e.g. 1500" />
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatedInput label="Budget Min (INR)" type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="e.g. 500000" />
                    <AnimatedInput label="Budget Max (INR)" type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="e.g. 1500000" />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <GradientButton onClick={() => setStep(2)} disabled={!canProceedStep1}>
                    Next <ArrowRight className="w-4 h-4" />
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <GlassCard>
                <h2 className="text-lg font-semibold mb-6">Style Preferences</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Select styles that match the client&apos;s taste</label>
                    <div className="flex flex-wrap gap-3">
                      {STYLE_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleStyle(s)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                            styles.includes(s)
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <AnimatedInput label="Family Size" type="number" value={familySize} onChange={(e) => setFamilySize(e.target.value)} placeholder="Number of family members" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Requirements</label>
                    <textarea
                      value={specialReqs}
                      onChange={(e) => setSpecialReqs(e.target.value)}
                      rows={4}
                      placeholder="Any special requests, accessibility needs, pets, etc."
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-sm resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <GradientButton variant="secondary" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </GradientButton>
                  <GradientButton onClick={() => setStep(3)}>
                    Next <ArrowRight className="w-4 h-4" />
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <GlassCard>
                <h2 className="text-lg font-semibold mb-6">Add Rooms</h2>

                <div className="space-y-4 p-4 bg-gray-50 rounded-xl mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatedInput label="Room Name" value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} placeholder="e.g. Master Bedroom" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Type</label>
                      <select
                        value={roomForm.room_type}
                        onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value as RoomType })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-sm"
                      >
                        {ROOM_TYPES.map((rt) => (
                          <option key={rt.value} value={rt.value}>{rt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <AnimatedInput label="Length (ft)" type="number" value={roomForm.length || ''} onChange={(e) => setRoomForm({ ...roomForm, length: Number(e.target.value) })} />
                    <AnimatedInput label="Width (ft)" type="number" value={roomForm.width || ''} onChange={(e) => setRoomForm({ ...roomForm, width: Number(e.target.value) })} />
                    <AnimatedInput label="Height (ft)" type="number" value={roomForm.height || ''} onChange={(e) => setRoomForm({ ...roomForm, height: Number(e.target.value) })} />
                  </div>

                  {roomForm.length > 0 && roomForm.width > 0 && (
                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-600">Area: <strong className="text-gray-900">{roomArea} sqft</strong></span>
                      <span className="text-gray-600">Wall Area: <strong className="text-gray-900">{roomWallArea} sqft</strong></span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Types</label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { key: 'has_false_ceiling' as const, label: 'False Ceiling' },
                        { key: 'has_flooring_work' as const, label: 'Flooring' },
                        { key: 'has_painting' as const, label: 'Painting' },
                        { key: 'has_carpentry' as const, label: 'Carpentry' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={roomForm[key] ?? false}
                            onChange={(e) => setRoomForm({ ...roomForm, [key]: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <AnimatedInput label="Electrical Pts" type="number" value={roomForm.electrical_points || ''} onChange={(e) => setRoomForm({ ...roomForm, electrical_points: Number(e.target.value) })} />
                    <AnimatedInput label="Plumbing Pts" type="number" value={roomForm.plumbing_points || ''} onChange={(e) => setRoomForm({ ...roomForm, plumbing_points: Number(e.target.value) })} />
                    <AnimatedInput label="Windows" type="number" value={roomForm.windows_count || ''} onChange={(e) => setRoomForm({ ...roomForm, windows_count: Number(e.target.value) })} />
                    <AnimatedInput label="Doors" type="number" value={roomForm.doors_count || ''} onChange={(e) => setRoomForm({ ...roomForm, doors_count: Number(e.target.value) })} />
                  </div>

                  <GradientButton variant="secondary" onClick={addRoomToList} disabled={!roomForm.name || roomForm.length <= 0 || roomForm.width <= 0}>
                    <Plus className="w-4 h-4" /> Add Room
                  </GradientButton>
                </div>

                {rooms.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-semibold text-gray-700">Added Rooms ({rooms.length})</h3>
                    {rooms.map((room) => (
                      <motion.div
                        key={room._key}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{room.name}</span>
                          <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full capitalize">{room.room_type}</span>
                          <span className="ml-3 text-sm text-gray-500">
                            {room.length}&times;{room.width}&times;{room.height ?? 10} ft
                          </span>
                          <span className="ml-2 text-sm text-gray-400">({room.length * room.width} sqft)</span>
                        </div>
                        <button onClick={() => removeRoom(room._key)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between">
                  <GradientButton variant="secondary" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </GradientButton>
                  <GradientButton onClick={() => setStep(4)}>
                    Next <ArrowRight className="w-4 h-4" />
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <GlassCard>
                <h2 className="text-lg font-semibold mb-2">Assign Labour</h2>
                <p className="text-sm text-gray-500 mb-6">Select labourers to assign to this project (you can also do this later)</p>

                {/* Labour selection */}
                <div className="space-y-3 mb-6">
                  {labourList.filter((l) => !selectedLabours.some((sl) => sl.labour.id === l.id)).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {labourList
                        .filter((l) => !selectedLabours.some((sl) => sl.labour.id === l.id))
                        .map((l) => (
                          <motion.div
                            key={l.id}
                            whileHover={{ scale: 1.01 }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-all"
                            onClick={() => setSelectedLabours((prev) => [...prev, { labour: l, role: l.specialization.replace('_', ' ') }])}
                          >
                            <div>
                              <span className="font-medium text-gray-900">{l.name}</span>
                              <span className="ml-2 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full capitalize">{l.specialization.replace('_', ' ')}</span>
                              <div className="text-xs text-gray-500 mt-0.5">{l.phone}{l.city ? ` · ${l.city}` : ''}</div>
                            </div>
                            <Plus className="w-4 h-4 text-gray-400" />
                          </motion.div>
                        ))}
                    </div>
                  ) : labourList.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <HardHat className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No labourers in directory yet.</p>
                      <p className="text-xs">You can add them later from the Labour page.</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">All labourers have been selected</p>
                  )}
                </div>

                {/* Selected labours */}
                {selectedLabours.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Selected ({selectedLabours.length})</h3>
                    <div className="space-y-2">
                      {selectedLabours.map((sl, idx) => (
                        <motion.div key={sl.labour.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{sl.labour.name}</span>
                            <span className="ml-2 text-xs text-blue-600 capitalize">{sl.labour.specialization.replace('_', ' ')}</span>
                          </div>
                          <input
                            type="text"
                            value={sl.role}
                            onChange={(e) => {
                              const updated = [...selectedLabours];
                              updated[idx] = { ...sl, role: e.target.value };
                              setSelectedLabours(updated);
                            }}
                            placeholder="Role"
                            className="w-40 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                          />
                          <button onClick={() => setSelectedLabours((prev) => prev.filter((_, i) => i !== idx))} className="p-1 text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <GradientButton variant="secondary" onClick={() => setStep(3)}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </GradientButton>
                  <GradientButton onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
                    Create Project
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, Pencil, Plus, Trash2, Zap, Droplets,
  LayoutGrid, PaintBucket, Hammer, Wind, DoorOpen, ChevronDown,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { useProject, useAddRoom, useDeleteRoom } from '@/hooks/useProjects';
import ProjectLabourSection from '@/components/projects/ProjectLabourSection';
import ProjectWorkLog from '@/components/projects/ProjectWorkLog';
import { updateProjectStatus } from '@/services/projectService';
import type { RoomCreate, RoomType, ProjectStatus } from '@/types/project';
import { useQueryClient } from '@tanstack/react-query';

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const statusColors: Record<string, string> = {
  discovery: 'bg-gray-100 text-gray-700',
  site_visit: 'bg-blue-100 text-blue-700',
  design: 'bg-purple-100 text-purple-700',
  quotation: 'bg-orange-100 text-orange-700',
  proposal_sent: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-teal-100 text-teal-700',
  in_progress: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

const statusLabels: Record<string, string> = {
  discovery: 'Discovery',
  site_visit: 'Site Visit',
  design: 'Design',
  quotation: 'Quotation',
  proposal_sent: 'Proposal Sent',
  approved: 'Approved',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const ALL_STATUSES: ProjectStatus[] = [
  'discovery', 'site_visit', 'design', 'quotation', 'proposal_sent', 'approved', 'in_progress', 'completed',
];

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

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);
  const { data: project, isLoading } = useProject(projectId);
  const addRoom = useAddRoom();
  const deleteRoom = useDeleteRoom();
  const queryClient = useQueryClient();

  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [roomForm, setRoomForm] = useState<RoomCreate>({
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
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-20">
          <span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </PageWrapper>
    );
  }

  if (!project) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Project not found</p>
          <GradientButton variant="secondary" className="mt-4" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </GradientButton>
        </div>
      </PageWrapper>
    );
  }

  const roomArea = roomForm.length * roomForm.width;
  const roomWallArea = 2 * (roomForm.length + roomForm.width) * (roomForm.height ?? 10);

  async function handleAddRoom() {
    if (!roomForm.name || roomForm.length <= 0 || roomForm.width <= 0) return;
    await addRoom.mutateAsync({ projectId, data: roomForm });
    setRoomForm({
      name: '', room_type: 'bedroom', length: 0, width: 0, height: 10,
      electrical_points: 0, plumbing_points: 0, windows_count: 0, doors_count: 0,
      has_false_ceiling: false, has_flooring_work: false, has_painting: false, has_carpentry: false,
    });
    setShowRoomForm(false);
  }

  async function handleDeleteRoom(roomId: number) {
    await deleteRoom.mutateAsync({ projectId, roomId });
  }

  async function handleStatusChange(status: ProjectStatus) {
    await updateProjectStatus(projectId, status);
    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    setShowStatusDropdown(false);
  }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => navigate('/projects')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3 h-3" /> Back to Projects
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {statusLabels[project.status] ?? project.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <GradientButton variant="secondary" size="sm" onClick={() => setShowStatusDropdown((v) => !v)}>
                Status <ChevronDown className="w-3 h-3" />
              </GradientButton>
              {showStatusDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[160px]">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${project.status === s ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <GradientButton variant="secondary" size="sm" onClick={() => navigate(`/projects/${projectId}/edit`)}>
              <Pencil className="w-3 h-3" /> Edit
            </GradientButton>
            {project.rooms.length > 0 && (
              <GradientButton size="sm" onClick={() => navigate(`/quotations/new?project=${projectId}`)}>
                <FileText className="w-3 h-3" /> Generate Quotation
              </GradientButton>
            )}
          </div>
        </div>

        {/* Project Info */}
        <GlassCard className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Project Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type</span>
              <p className="font-medium capitalize">{project.project_type}</p>
            </div>
            <div>
              <span className="text-gray-500">Address</span>
              <p className="font-medium">{project.address || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">Total Area</span>
              <p className="font-medium">{project.total_area_sqft ? `${project.total_area_sqft} sqft` : '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">Budget Range</span>
              <p className="font-medium">
                {project.budget_min && project.budget_max
                  ? `${formatINR(project.budget_min)} - ${formatINR(project.budget_max)}`
                  : '-'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Family Size</span>
              <p className="font-medium">{project.family_size ?? '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">Style Preferences</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {project.style_preferences.length > 0
                  ? project.style_preferences.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s}</span>
                    ))
                  : <span className="text-gray-400">-</span>}
              </div>
            </div>
          </div>
          {project.special_requirements && (
            <div className="mt-4 text-sm">
              <span className="text-gray-500">Special Requirements</span>
              <p className="font-medium mt-1">{project.special_requirements}</p>
            </div>
          )}
        </GlassCard>

        {/* Rooms Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Rooms ({project.rooms.length})</h2>
          <GradientButton variant="secondary" size="sm" onClick={() => setShowRoomForm((v) => !v)}>
            <Plus className="w-4 h-4" /> Add Room
          </GradientButton>
        </div>

        <AnimatePresence>
          {showRoomForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <GlassCard className="mb-6">
                <h3 className="font-semibold mb-4">New Room</h3>
                <div className="space-y-4">
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
                      <span className="text-gray-600">Area: <strong>{roomArea} sqft</strong></span>
                      <span className="text-gray-600">Wall Area: <strong>{roomWallArea} sqft</strong></span>
                    </div>
                  )}
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
                  <div className="grid grid-cols-4 gap-4">
                    <AnimatedInput label="Electrical Pts" type="number" value={roomForm.electrical_points || ''} onChange={(e) => setRoomForm({ ...roomForm, electrical_points: Number(e.target.value) })} />
                    <AnimatedInput label="Plumbing Pts" type="number" value={roomForm.plumbing_points || ''} onChange={(e) => setRoomForm({ ...roomForm, plumbing_points: Number(e.target.value) })} />
                    <AnimatedInput label="Windows" type="number" value={roomForm.windows_count || ''} onChange={(e) => setRoomForm({ ...roomForm, windows_count: Number(e.target.value) })} />
                    <AnimatedInput label="Doors" type="number" value={roomForm.doors_count || ''} onChange={(e) => setRoomForm({ ...roomForm, doors_count: Number(e.target.value) })} />
                  </div>
                  <div className="flex gap-2">
                    <GradientButton onClick={handleAddRoom} isLoading={addRoom.isPending} disabled={!roomForm.name || roomForm.length <= 0 || roomForm.width <= 0}>
                      <Plus className="w-4 h-4" /> Add Room
                    </GradientButton>
                    <GradientButton variant="ghost" onClick={() => setShowRoomForm(false)}>Cancel</GradientButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {project.rooms.length === 0 ? (
          <GlassCard className="flex flex-col items-center py-12">
            <DoorOpen className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-1">No rooms added yet</p>
            <p className="text-gray-400 text-sm">Add rooms to start building your project scope</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.rooms.map((room) => (
              <GlassCard key={room.id} className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{room.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full capitalize">{room.room_type}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex gap-4">
                    <span>Dimensions: <strong>{room.length}&times;{room.width}&times;{room.height} ft</strong></span>
                  </div>
                  <div className="flex gap-4">
                    <span>Floor: <strong>{room.area_sqft} sqft</strong></span>
                    <span>Wall: <strong>{room.wall_area_sqft} sqft</strong></span>
                    <span>Ceiling: <strong>{room.ceiling_area_sqft} sqft</strong></span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {room.has_false_ceiling && <WorkBadge icon={<LayoutGrid className="w-3 h-3" />} label="Ceiling" />}
                    {room.has_flooring_work && <WorkBadge icon={<LayoutGrid className="w-3 h-3" />} label="Flooring" />}
                    {room.has_painting && <WorkBadge icon={<PaintBucket className="w-3 h-3" />} label="Painting" />}
                    {room.has_carpentry && <WorkBadge icon={<Hammer className="w-3 h-3" />} label="Carpentry" />}
                  </div>

                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    {room.electrical_points > 0 && (
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {room.electrical_points} elec</span>
                    )}
                    {room.plumbing_points > 0 && (
                      <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {room.plumbing_points} plumb</span>
                    )}
                    {room.windows_count > 0 && (
                      <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> {room.windows_count} win</span>
                    )}
                    {room.doors_count > 0 && (
                      <span className="flex items-center gap-1"><DoorOpen className="w-3 h-3" /> {room.doors_count} door</span>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      {/* Labour Section */}
      <div className="mt-8">
        <ProjectLabourSection projectId={projectId} />
      </div>

      {/* Daily Work Log */}
      <div className="mt-8">
        <GlassCard>
          <ProjectWorkLog projectId={projectId} />
        </GlassCard>
      </div>
      </div>
    </PageWrapper>
  );
}

function WorkBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">
      {icon} {label}
    </span>
  );
}

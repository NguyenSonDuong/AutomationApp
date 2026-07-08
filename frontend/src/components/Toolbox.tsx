import React from 'react';
import { 
  Plus, 
  MousePointer, 
  Type, 
  Compass, 
  Sliders, 
  ArrowRightLeft, 
  Upload, 
  X, 
  List,
  Power,
  Database,
  Milestone
} from 'lucide-react';

const ACTION_TEMPLATES = [
  { type: 'new_tab', label: 'Tạo tab mới', icon: Plus },
  { type: 'open_tab', label: 'Mở URL', icon: Compass },
  { type: 'switch_tab', label: 'Chuyển tab', icon: ArrowRightLeft },
  { type: 'close_tab', label: 'Đóng tab', icon: X },
  { type: 'click', label: 'Click chuột', icon: MousePointer },
  { type: 'click_checkbox', label: 'Click checkbox', icon: MousePointer },
  { type: 'fill_text', label: 'Điền chữ', icon: Type },
  { type: 'select_option', label: 'Chọn option', icon: List },
  { type: 'scroll', label: 'Cuộn trang', icon: Sliders },
  { type: 'drag_drop', label: 'Kéo thả', icon: Sliders },
  { type: 'upload_file', label: 'Tải file', icon: Upload },
  { type: 'close_browser', label: 'Đóng trình duyệt', icon: Power },
  { type: 'extract_data', label: 'Lấy dữ liệu', icon: Database },
  { type: 'waypoint', label: 'Chuyển hướng', icon: Milestone }
];

const Toolbox: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="toolbox">
      <span className="toolbox-label">Thanh hành động:</span>
      {ACTION_TEMPLATES.map((tmpl) => {
        const IconComponent = tmpl.icon;
        return (
          <div
            key={tmpl.type}
            className="toolbox-item"
            onDragStart={(event) => onDragStart(event, tmpl.type)}
            draggable
            title={`Kéo thả hành động ${tmpl.label} vào vùng Canvas`}
          >
            <IconComponent size={14} />
            <span>{tmpl.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Toolbox;

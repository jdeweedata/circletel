import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { WorkflowStepper } from './components/WorkflowStepper';
import { Card } from './components/Card';
import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  Download, 
  Box, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  User,
  MapPin,
  Package,
  Wallet,
  Wrench,
  Calendar,
  Clock,
  Phone,
  Mail,
  RefreshCw,
  File,
  Bell,
  Inbox,
  Banknote,
  CheckSquare,
  Wifi,
  Search
} from 'lucide-react';
import { OrderData, WorkflowStep } from './types';

// Initial data moved outside component to be used as initial state
const initialWorkflow: WorkflowStep[] = [
  { id: 1, label: "Order Received", subLabel: "Order created", status: "completed", icon: Inbox, date: "Nov 8, 08:08" },
  { id: 2, label: "Payment Method", subLabel: "Method registered", status: "completed", icon: CreditCard, date: "Nov 8, 08:15" },
  { id: 3, label: "Payment Confirmed", subLabel: "Deposit received", status: "completed", icon: Banknote, date: "Nov 9, 10:00" },
  { id: 4, label: "Scheduled", subLabel: "Install booked", status: "completed", icon: Calendar, date: "Nov 9, 14:30" },
  { id: 5, label: "Installation", subLabel: "Tech on-site", status: "active", icon: Wrench, date: "Nov 21" },
  { id: 6, label: "Completion", subLabel: "Work finished", status: "pending", icon: CheckSquare },
  { id: 7, label: "Active", subLabel: "Service live", status: "pending", icon: Wifi },
];

const initialOrder: OrderData = {
  id: "ORD-20251108-9841",
  createdDate: "11/8/2025 at 8:08:35 AM",
  status: "Installation In Progress",
  paymentStatus: {
    status: "Pending",
    mandate: "Mandate Active",
    method: "Debit Order"
  },
  totalAmount: "R899.00",
  workflow: initialWorkflow,
  customer: {
    name: "Shaun Robertson",
    email: "shaunr07@gmail.com",
    phone: "0826574256",
    contactPref: "Email",
    marketingOptIn: "No",
    whatsappOptIn: "No"
  },
  address: {
    street: "Farrar St, Comet, Boksburg, 1459"
  },
  package: {
    name: "SkyFibre Home Plus",
    speed: "100/50 Mbps",
    price: "R899.00",
    installFee: "R0.00",
    routerIncluded: "No"
  },
  paymentInfo: {
    method: "Debit Order",
    status: "Pending",
    reference: "PAY-ORD-20251108-9841",
    totalPaid: "R0.00"
  },
  installation: {
    status: "Scheduled",
    date: "Friday, November 21, 2025",
    slot: "Morning",
    technician: "Kegan Struiss",
    techPhone: "0609814327",
    techEmail: "assistantjhb1@newgenmc.co.za"
  },
  paymentMethodDetails: {
    bank: "NetCash",
    accountName: "NetCash Debit Order",
    accountNumber: "XXXX",
    accountType: "Cheque",
    amount: "R899.00/month",
    frequency: "Monthly",
    day: "1st",
    signed: "11/22/2025"
  },
  timeline: [
    { id: 1, title: "Order created", description: "Order ORD-20251108-9841 was created", date: "Nov 8, 08:08 AM", iconType: 'doc' },
    { id: 2, title: "Installation scheduled", description: "Scheduled for 2025-11-21 (morning)", date: "1 day ago", iconType: 'calendar' },
  ],
  source: {
    lead: "Coverage Checker"
  },
  timestamps: {
    createdAt: "11/8/2025 at 8:08:35 AM",
    updatedAt: "11/22/2025 at 1:15:37 PM"
  }
};

function App() {
  const [order, setOrder] = useState<OrderData>(initialOrder);

  const handleStepClick = (stepId: number) => {
    // Update workflow status based on clicked step
    const updatedWorkflow = order.workflow.map(step => {
      if (step.id < stepId) {
        return { ...step, status: 'completed' as const };
      } else if (step.id === stepId) {
        return { ...step, status: 'active' as const };
      } else {
        return { ...step, status: 'pending' as const };
      }
    });

    setOrder(prev => ({
      ...prev,
      workflow: updatedWorkflow,
      status: getStatusFromWorkflow(stepId)
    }));
  };

  const getStatusFromWorkflow = (stepId: number): string => {
    switch(stepId) {
      case 1: return "Order Received";
      case 2: return "Payment Method";
      case 3: return "Payment Confirmed";
      case 4: return "Installation Scheduled";
      case 5: return "Installation In Progress";
      case 6: return "Installation Complete";
      case 7: return "Service Active";
      default: return "Processing";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <Sidebar />
      
      <main className="flex-1 overflow-x-hidden overflow-y-auto pb-10">
        {/* Top Bar */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="md:hidden">
                 <Search size={20} className="text-gray-400" />
              </div>
              <div className="flex flex-col">
                 <h1 className="text-lg font-bold text-gray-800">Order Details</h1>
                 <span className="text-xs text-gray-500 hidden md:block">View and manage order information</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer">
                DA
              </div>
           </div>
        </header>

        <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
          
          {/* Order Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-gray-600 hover:text-primary cursor-pointer transition-colors group">
              <div className="p-1 rounded-full group-hover:bg-indigo-50 transition-colors">
                <ArrowLeft size={20} />
              </div>
              <span className="font-medium">Back to Orders</span>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
               <div className="flex items-center gap-3">
                 <h2 className="text-2xl font-bold text-gray-900">Order #{order.id}</h2>
                 <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                   order.status.includes('Active') ? 'bg-green-100 text-green-700 border-green-200' :
                   order.status.includes('Progress') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                   'bg-gray-100 text-gray-700 border-gray-200'
                 }`}>
                    {order.status}
                 </span>
               </div>
               <span className="text-sm text-gray-500 mt-1">Created {order.createdDate}</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
                <Edit size={16} /> <span className="hidden sm:inline">Edit</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
                <Printer size={16} /> <span className="hidden sm:inline">Print</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-600 transition-all shadow-sm">
                <Download size={16} /> <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Top Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order Status</p>
                <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                   {order.status}
                </div>
                <p className="text-xs text-gray-400 mt-1">Last updated today</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                 <Box size={20} className="text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment</p>
                <div className="flex items-center gap-2 mb-1">
                   <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">{order.paymentStatus.status}</span>
                   <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded flex items-center gap-1"><CheckCircle size={10}/> {order.paymentStatus.mandate}</span>
                </div>
                <p className="text-sm text-gray-600">{order.paymentStatus.method}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                 <CreditCard className="text-amber-500" size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{order.totalAmount}</p>
                <p className="text-xs text-gray-400 mt-1">Monthly recurring</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                 <FileText className="text-green-500" size={20} />
              </div>
            </div>
          </div>

          {/* Order Workflow */}
          <Card title="Order Progress" className="overflow-visible">
            <WorkflowStepper steps={order.workflow} onStepClick={handleStepClick} />
          </Card>

          {/* Actions */}
          <Card title="Quick Actions">
            <div className="flex flex-wrap gap-4">
               <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-medium hover:bg-green-100 transition-colors">
                  <CheckCircle size={16} /> Complete Installation
               </button>
               <button className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-sm font-medium hover:bg-amber-100 transition-colors">
                  <AlertTriangle size={16} /> Report Issue
               </button>
               <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm font-medium hover:bg-red-100 transition-colors">
                  <XCircle size={16} /> Cancel Order
               </button>
            </div>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              
              <Card title="Customer Information" icon={<User size={20} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-gray-500 uppercase">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">{order.customer.name}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-gray-500 uppercase">Email Address</p>
                    <a href={`mailto:${order.customer.email}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-2 border-b border-gray-100 pb-2 w-fit">
                      <Mail size={14} /> {order.customer.email}
                    </a>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-gray-500 uppercase">Phone Number</p>
                    <a href={`tel:${order.customer.phone}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-2 border-b border-gray-100 pb-2 w-fit">
                      <Phone size={14} /> {order.customer.phone}
                    </a>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-3 gap-4 mt-2 bg-gray-50 p-4 rounded-md border border-gray-100">
                     <div>
                        <p className="text-xs font-bold text-gray-500 mb-1">Contact Pref</p>
                        <p className="text-sm text-gray-900 font-medium">{order.customer.contactPref}</p>
                     </div>
                     <div>
                        <p className="text-xs font-bold text-gray-500 mb-1">Marketing</p>
                        <p className="text-sm text-gray-900 font-medium">{order.customer.marketingOptIn}</p>
                     </div>
                     <div>
                        <p className="text-xs font-bold text-gray-500 mb-1">WhatsApp</p>
                        <p className="text-sm text-gray-900 font-medium">{order.customer.whatsappOptIn}</p>
                     </div>
                  </div>
                </div>
              </Card>

              <Card title="Installation Address" icon={<MapPin size={20} />}>
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                       <MapPin className="text-blue-500" size={20} />
                    </div>
                    <div className="flex-1">
                       <p className="text-xs font-bold text-gray-500 uppercase mb-1">Service Address</p>
                       <p className="text-lg font-medium text-gray-900">{order.address.street}</p>
                       <div className="mt-3 flex gap-2">
                          <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors flex items-center gap-1">
                            <MapPin size={12} /> View on Map
                          </button>
                       </div>
                    </div>
                 </div>
              </Card>

              <Card title="Package Details" icon={<Package size={20} />}>
                 <div className="grid grid-cols-2 gap-y-6">
                    <div>
                       <p className="text-xs font-bold text-gray-500 uppercase mb-1">Package Name</p>
                       <p className="text-sm font-bold text-primary">{order.package.name}</p>
                    </div>
                    <div>
                       <p className="text-xs font-bold text-gray-500 uppercase mb-1">Speed</p>
                       <p className="text-sm text-gray-900 flex items-center gap-1"><Wifi size={14} className="text-gray-400" /> {order.package.speed}</p>
                    </div>
                    <div>
                       <p className="text-xs font-bold text-gray-500 uppercase mb-1">Monthly Price</p>
                       <p className="text-sm font-semibold text-gray-900">{order.package.price}</p>
                    </div>
                    <div>
                       <p className="text-xs font-bold text-gray-500 uppercase mb-1">Installation Fee</p>
                       <p className="text-sm text-gray-900">{order.package.installFee}</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-gray-100">
                       <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-gray-500 uppercase">Router Included</p>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">{order.package.routerIncluded}</span>
                       </div>
                    </div>
                 </div>
              </Card>

              <Card title="Payment Information" icon={<Wallet size={20} />}>
                 <div className="grid grid-cols-2 gap-y-6">
                    <div>
                       <p className="text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</p>
                       <p className="text-sm text-gray-900">{order.paymentInfo.method}</p>
                    </div>
                    <div>
                       <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status</p>
                       <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-md border border-amber-200">
                          {order.paymentInfo.status}
                       </span>
                    </div>
                    <div className="col-span-2">
                       <p className="text-xs font-bold text-gray-500 uppercase mb-1">Payment Reference</p>
                       <p className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200 inline-block">{order.paymentInfo.reference}</p>
                    </div>
                 </div>
              </Card>

            </div>

            {/* Right Column */}
            <div className="space-y-6">

               <Card 
                 title="Installation Details" 
                 icon={<Wrench size={20} />}
                 badge={<span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-200">Scheduled</span>}
               >
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 mb-1">
                             <Calendar size={12} /> DATE
                          </div>
                          <p className="text-sm font-semibold text-gray-900">Nov 21, 2025</p>
                       </div>
                       <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 mb-1">
                             <Clock size={12} /> SLOT
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{order.installation.slot}</p>
                       </div>
                     </div>

                     <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Assigned Technician</p>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                           <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 border-2 border-white shadow-sm">
                             KS
                           </div>
                           <div className="space-y-0.5 overflow-hidden">
                              <p className="text-sm font-bold text-gray-900">{order.installation.technician}</p>
                              <div className="flex gap-3">
                                <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                                   <Phone size={14} />
                                </a>
                                <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                                   <Mail size={14} />
                                </a>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </Card>

               <Card 
                 title="Payment Method" 
                 icon={<CreditCard size={20} />}
                 badge={
                   <div className="flex flex-col items-end">
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-200">
                        <CheckCircle size={10} /> VERIFIED
                      </span>
                   </div>
                 }
               >
                  <div className="space-y-4">
                     <p className="text-xs text-gray-500 italic">Active Debit Order Mandate</p>
                     
                     <div className="space-y-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bank Account</p>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                           <span className="text-gray-500 text-xs">Bank</span>
                           <span className="font-semibold text-right text-gray-800">{order.paymentMethodDetails.bank}</span>

                           <span className="text-gray-500 text-xs">Account Name</span>
                           <span className="font-semibold text-right text-gray-800 truncate">{order.paymentMethodDetails.accountName}</span>

                           <span className="text-gray-500 text-xs">Account No.</span>
                           <span className="font-semibold text-right text-gray-800">{order.paymentMethodDetails.accountNumber}</span>
                        </div>
                     </div>

                     <div className="space-y-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Collection</p>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                           <span className="text-gray-500 text-xs">Amount</span>
                           <span className="font-semibold text-right text-gray-800">{order.paymentMethodDetails.amount}</span>

                           <span className="text-gray-500 text-xs">Day</span>
                           <span className="font-semibold text-right text-gray-800">{order.paymentMethodDetails.day}</span>
                        </div>
                     </div>

                     <button className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-xs font-bold text-gray-600 hover:bg-white hover:text-primary transition-all shadow-sm">
                        <RefreshCw size={12} /> Validate Account
                     </button>
                  </div>
               </Card>

               <Card title="Order Timeline" icon={<Clock size={20} />} badge={<span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Recent</span>}>
                  <div className="relative pl-2">
                     {/* Vertical Line */}
                     <div className="absolute top-3 bottom-3 left-[19px] w-[2px] bg-gray-100"></div>
                     
                     <div className="space-y-6">
                        {order.timeline.map((event) => (
                           <div key={event.id} className="relative flex gap-4 items-start group">
                              <div className={`relative z-10 w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border-2 shadow-sm transition-transform group-hover:scale-105
                                 ${event.iconType === 'doc' ? 'bg-white border-blue-100 text-blue-500' : 'bg-white border-green-100 text-green-500'}`}>
                                 {event.iconType === 'doc' ? <File size={16} /> : <Calendar size={16} />}
                              </div>
                              <div className="flex-1 pt-1">
                                 <div className="flex justify-between items-start">
                                    <p className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors">{event.title}</p>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded">{event.date}</span>
                                 </div>
                                 <p className="text-xs text-gray-500 mt-1 leading-relaxed">{event.description}</p>
                                 {event.id === 2 && (
                                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded">
                                       <User size={10} /> Tech: {order.installation.technician}
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </Card>

               <Card title="Order Source" icon={<FileText size={20} />}>
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Lead Source</p>
                        <p className="text-sm font-semibold text-gray-900">{order.source.lead}</p>
                     </div>
                     <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        <Search size={16} />
                     </div>
                  </div>
               </Card>

               <div className="px-2">
                   <p className="text-[10px] text-gray-400 text-center">
                      Created: {order.timestamps.createdAt} • Updated: {order.timestamps.updatedAt}
                   </p>
               </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
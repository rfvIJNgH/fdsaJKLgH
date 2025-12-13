import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { SearchProvider } from "./contexts/SearchContext";
import { Toaster } from "react-hot-toast";
import { NotificationProvider } from "./contexts/NotificationContext";
import { UserProvider } from "./contexts/UserContext";


// Components
import Layout from "./components/Layout/Layout";
import Profile from "./pages/Profile/Profile";

// Pages
import Home from "./pages/Home";
import SignUp from "./pages/Auth/SignUp";
import Login from "./pages/Auth/Login";
import NotFound from "./pages/NotFound";
import Upload from "./pages/Contents/Upload";
import ContentDetail from "./pages/Contents/ContentDetail";
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import TradingUpload from "./pages/Trading/TradingUpload";
import TradingPage from "./pages/Trading/TradingPage";
import TradeRequests from "./pages/Trading/TradeRequests";
import Collections from "./pages/Collections/Collections";
import CollectionDetail from "./pages/Collections/CollectionDetail";
import Messages from "./pages/Messages/Message";
import Settings from "./pages/Settings";
import Notification from "./pages/Notificatoin";
import Moderation from "./pages/Moderation";
import Donate from "./pages/Donate";
import Analytics from "./pages/Analytics Dashboard/Analytics";
import Streaming from "./pages/Streaming/Streaming";
import MyContent from "./pages/Contents/MyContent";
import PurchaseCoins from "./pages/Coins/PurchaseCoins";
import UpgradePlan from "./pages/UpgradePlan";
import StreamingRoom from "./pages/Streaming/StreamingRoom";
import JoinStreamingRoom from "./pages/Streaming/JoinStreamingRoom";
import LayoutWithoutNav from "./components/Layout/LayoutWithoutNav";

import { useSocket } from "./hooks/useSocket";
import { useEffect } from "react";
import { useChatStore } from "./store/useChatStore";
import { CoinProvider } from "./contexts/CoinContext";
import EditContent from "./pages/Contents/EditContent";

function App() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const { setSocketConnect } = useChatStore();
  const socket = useSocket('http://localhost:8080');

  useEffect(() => {
    if (socket && user) {
      setSocketConnect(user.id, socket!);
    }
  }, [socket, user])

  return (
    <CoinProvider>
      <SearchProvider>
        <NotificationProvider>
          <UserProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: "#4ade80",
                    secondary: "#fff",
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                  },
                },
              }}
            />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route
                  path="/signup"
                  element={isAuthenticated ? <Navigate to="/" /> : <SignUp />}
                />
                <Route path="/login" element={<Login />} />

                {/* Public Profile Page */}
                <Route path="/:username/profile" element={<Profile />} />

                {/* Upload Page */}
                <Route
                  path="/upload"
                  element={
                    isAuthenticated ? (
                      <Upload />
                    ) : (
                      <Navigate to="/login" state={{ from: location }} replace />
                    )
                  }
                />

                {/*Setting Page */}
                <Route
                  path="/settings"
                  element={
                    isAuthenticated ? (
                      <Settings />
                    ) : (
                      <Navigate
                        to="/settings"
                        state={{ from: location }}
                        replace
                      />
                    )
                  }
                />

                {/*Moderation Page*/}
                <Route path="/moderation" element={<Moderation />} />

                {/* Content Detail Page */}
                <Route path="/content/:id" element={<ContentDetail />} />

                <Route path="/content/:id/edit" element={<EditContent />} />

                {/* Followers/Following Pages */}
                <Route
                  path="/profile/:username/followers"
                  element={<Followers />}
                />
                <Route
                  path="/profile/:username/following"
                  element={<Following />}
                />

                {/* Trading Upload Page */}
                <Route path="/trading/upload" element={<TradingUpload />} />

                {/* Trading Content Page */}
                <Route path="/trading" element={<TradingPage />} />

                {/* Trade Requests Page */}
                <Route path="/trading/requests" element={<TradeRequests />} />

                {/* Collections Pages */}
                <Route
                  path="/collections"
                  element={<Collections isOwnProfile={true} />}
                />

                <Route path="/collections/:id" element={<CollectionDetail />} />

                {/*My Content Page*/}
                <Route path="/mycontent/:username" element={<MyContent />} />

                {/* CreateStreaming Page*/}
                <Route path="/streaming" element={<Streaming />} />

                {/* Messages Page */}
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:userId" element={<Messages />} />

                {/* Donate Page */}
                <Route path="/donate" element={<Donate />} />
                <Route path="/donate/:userId" element={<Donate />} />

                {/*Notification Page */}
                <Route path="/notification" element={<Notification />} />

                {/*Analytics Page */}
                <Route path="/analytics" element={<Analytics />} />

                {/*Purchase Page */}
                <Route path="/purchase-coins" element={<PurchaseCoins />} />

                {/*UpgradePlan Page*/}
                <Route path="/upgradeplan" element={<UpgradePlan />} />

                {/* Not Found */}
                <Route path="*" element={<NotFound />} />
              </Route>

              {/**Layout Without Navbar and Footer */}
              <Route element={<LayoutWithoutNav />}>
                {/* StreamingRoom Page*/}
                <Route path="/streaming/:username/:selectedtype" element={<StreamingRoom />} />
                <Route path="/streaming/joinstreaming/:streamingid" element={<JoinStreamingRoom />} />
              </Route>
            </Routes>
          </UserProvider>
        </NotificationProvider>
      </SearchProvider>
      </CoinProvider>
  );
}

export default App;

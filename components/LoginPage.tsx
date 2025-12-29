
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, RefreshCw, BarChart3, Target, AlertTriangle, MessageCircle, ShieldCheck, Cpu } from 'lucide-react';
import { COLORS } from '../constants';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaCode, setCaptchaCode] = useState('AB12');
  const [loading, setLoading] = useState(false);

  // 预设演示账号
  const DEMO_ACCOUNTS: Record<string, { password: string; name: string; role: string }> = {
    admin: { password: 'admin123', name: '合规部负责人', role: 'admin' },
    sfecr001: { password: '888888', name: '系统管理员', role: 'admin' },
  };

  // 刷新验证码
  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptcha('');
  };

  // 组件加载时自动生成验证码
  useEffect(() => {
    refreshCaptcha();
  }, []);

  const handleLogin = () => {
    if (!username || !password || !captcha) {
      alert('请填写完整的登录信息');
      return;
    }

    if (captcha.toUpperCase() !== captchaCode.toUpperCase()) {
      alert('验证码错误');
      refreshCaptcha();
      return;
    }

    const account = DEMO_ACCOUNTS[username];
    if (!account || account.password !== password) {
      alert('用户名或密码错误');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onLogin();
      setLoading(false);
    }, 800);
  };

  const features = [
    { Icon: Target, title: 'AI监管对标', desc: '秒级匹配国资监管指引', color: COLORS.PRIMARY },
    { Icon: BarChart3, title: '风险评估', desc: '多维度量化合规风险等级', color: '#3370FF' },
    { Icon: AlertTriangle, title: '动态监测', desc: '实时监控重点经营领域', color: COLORS.RED },
    { Icon: MessageCircle, title: '智能参谋', desc: '24小时在线合规咨询助手', color: COLORS.GREEN },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F7F8FA' }}>
      {/* 左侧品牌区域 */}
      <div style={{
        display: 'none',
        width: '50%',
        background: `linear-gradient(135deg, ${COLORS.BLUE} 0%, #0A3A8F 100%)`,
        padding: '48px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }} className="lg:flex">
        {/* 装饰性背景 */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05 }}>
          <div style={{ position: 'absolute', top: '80px', left: '80px', width: '256px', height: '256px', border: '2px solid white', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '80px', right: '80px', width: '384px', height: '384px', border: '2px solid white', borderRadius: '50%' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* Logo 区域 */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '64px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, #D4A853 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(191, 147, 59, 0.3)'
            }}>
              <ShieldCheck size={32} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ height: '40px', width: '1px', background: '#E5E6EB' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: COLORS.BLUE, letterSpacing: '-0.5px' }}>国企合规智能体</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#646A73', fontWeight: 700 }}>SOE Compliance Agent</p>
            </div>
          </div>

          <div style={{ maxWidth: '480px' }}>
            <h2 style={{ color: 'white', fontSize: '32px', fontWeight: 900, marginBottom: '16px', lineHeight: 1.3 }}>
              数字化护航
              <br />
              赋能国企高质量发展
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '18px', marginBottom: '48px', lineHeight: 1.6, fontWeight: 500 }}>
              基于 AI 技术，实现经营管理事实采集、风险诊断、整改建议全流程智能化管理
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {features.map((feature, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'background 0.2s'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                    <feature.Icon size={32} color={feature.color} />
                  </div>
                  <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{feature.title}</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', margin: 0, fontWeight: 500 }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', margin: 0, fontWeight: 700 }}>© 2025 四川栎东数字能源科技. All rights reserved.</p>
        </div>
      </div>

      {/* 右侧登录表单区域 */}
      {/* Fix: Changed justifyCenter to justifyContent on line 159 */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }} className="lg:w-1/2">
        <div style={{ width: '100%', maxWidth: '448px', margin: '0 auto' }}>
          {/* 移动端 Logo */}
          <div style={{ display: 'block', marginBottom: '32px', textAlign: 'center' }} className="lg:hidden">
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, #D4A853 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(191, 147, 59, 0.3)'
              }}>
                <Cpu size={40} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0, color: COLORS.BLUE }}>国企合规智能体</h1>
                <p style={{ fontSize: '14px', color: '#646A73', margin: '4px 0 0 0', fontWeight: 700 }}>SOE Compliance Agent</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E6EB', overflow: 'hidden' }}>
            <div style={{ padding: '40px' }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px', color: '#1F2329' }}>欢迎登录</h2>
                <p style={{ fontSize: '14px', color: '#646A73', margin: 0, fontWeight: 700 }}>请输入您的账号信息进入系统</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#1F2329' }}>用户名</label>
                  <input
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    style={{ width: '100%', height: '48px', padding: '0 16px', fontSize: '14px', border: '1px solid #E5E6EB', borderRadius: '12px', outline: 'none', transition: 'border-color 0.2s', fontWeight: 500 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#1F2329' }}>密码</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      style={{ width: '100%', height: '48px', padding: '0 48px 0 16px', fontSize: '14px', border: '1px solid #E5E6EB', borderRadius: '12px', outline: 'none', transition: 'border-color 0.2s', fontWeight: 500 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#646A73', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#1F2329' }}>验证码</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="验证码"
                      value={captcha}
                      onChange={(e) => setCaptcha(e.target.value)}
                      maxLength={4}
                      style={{ flex: 1, height: '48px', padding: '0 16px', fontSize: '14px', border: '1px solid #E5E6EB', borderRadius: '12px', outline: 'none', fontWeight: 700, letterSpacing: '2px' }}
                    />
                    {/* Fix: Changed justifyCenter to justifyContent on line 235 */}
                    <div style={{ width: '112px', height: '48px', background: 'linear-gradient(135deg, rgba(191, 147, 59, 0.1) 0%, rgba(191, 147, 59, 0.05) 100%)', border: '1px solid #E5E6EB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
                      <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '4px', color: COLORS.PRIMARY, fontFamily: 'monospace', width: '100%', textAlign: 'center' }}>
                        {captchaCode}
                      </span>
                    </div>
                    {/* Fix: Changed justifyCenter to justifyContent on line 240 */}
                    <button type="button" onClick={refreshCaptcha} title="刷新验证码" style={{ width: '48px', height: '48px', background: 'white', border: '1px solid #E5E6EB', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RefreshCw size={20} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', height: '52px', background: loading ? '#A67D2F' : COLORS.PRIMARY, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(191, 147, 59, 0.2)' }}
                >
                  {loading ? '正在验证身份...' : '进入系统'}
                </button>
              </form>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#8F959E', margin: 0, fontWeight: 500 }}>
                  登录即表示您同意
                  <a href="#" style={{ color: COLORS.PRIMARY, textDecoration: 'none', marginLeft: '4px', fontWeight: 700 }}>服务条款</a>
                  和
                  <a href="#" style={{ color: COLORS.PRIMARY, textDecoration: 'none', marginLeft: '4px', fontWeight: 700 }}>隐私政策</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

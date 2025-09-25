#include <iomanip>
#include <napi.h>
#include <sstream>

#include "ManageLicense.h"

namespace {
    using Clock = std::chrono::system_clock;

    ManageLicense& LicenseManager() {
        static ManageLicense manager;
        return manager;
    }

    std::string ToIsoString(const Clock::time_point& timePoint) {
        auto timeT = Clock::to_time_t(timePoint);
        std::tm tm{};
    #ifdef _WIN32
        gmtime_s(&tm, &timeT);
    #else
        gmtime_r(&timeT, &tm);
    #endif
        std::ostringstream oss;
        oss << std::put_time(&tm, "%Y-%m-%dT%H:%M:%SZ");
        return oss.str();
    }

    std::string ToString(LicenseStatus status) {
        switch (status) {
            case LicenseStatus::Active:
                return "active";
            case LicenseStatus::Inactive:
                return "inactive";
            case LicenseStatus::Expired:
                return "expired";
            case LicenseStatus::Pending:
                return "pending";
            case LicenseStatus::Revoked:
                return "revoked";
            default:
                return "unknown";
        }
    }

    std::string ToString(LicenseTier tier) {
        switch (tier) {
            case LicenseTier::Trial:
                return "trial";
            case LicenseTier::Standard:
                return "standard";
            case LicenseTier::Professional:
                return "professional";
            case LicenseTier::Enterprise:
                return "enterprise";
            default:
                return "unknown";
        }
    }

    Napi::Object ActivationToJS(Napi::Env env, const Activation& activation) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("machineId", activation.machineId);
        obj.Set("activatedBy", activation.activatedBy);
        obj.Set("activatedAt", ToIsoString(activation.activatedAt));
        if (activation.lastHeartbeat.has_value()) {
            obj.Set("lastHeartbeat", ToIsoString(activation.lastHeartbeat.value()));
        } else {
            obj.Set("lastHeartbeat", env.Null());
        }
        return obj;
    }

    Napi::Object LicenseToJS(Napi::Env env, const License& license) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("key", license.key);
        obj.Set("productName", license.productName);
        obj.Set("ownerName", license.ownerName);
        obj.Set("tier", ToString(license.tier));
        obj.Set("status", ToString(license.status));
        obj.Set("issuedAt", ToIsoString(license.issuedAt));
        obj.Set("expiresAt", ToIsoString(license.expiresAt));
        obj.Set("activationLimit", license.activationLimit);
        obj.Set("notes", license.notes);

        auto activations = Napi::Array::New(env, license.activations.size());
        for (size_t index = 0; index < license.activations.size(); ++index) {
            activations[index] = ActivationToJS(env, license.activations[index]);
        }
        obj.Set("activations", activations);
        obj.Set("remainingDays", LicenseManager().GetRemainingDays(license.key));
        return obj;
    }

    Activation ActivationFromJS(const Napi::Object& obj) {
        Activation activation{};
        activation.machineId = obj.Get("machineId").As<Napi::String>().Utf8Value();
        activation.activatedBy = obj.Has("activatedBy") ? obj.Get("activatedBy").As<Napi::String>().Utf8Value() : "unknown";
        activation.activatedAt = Clock::now();
        if (obj.Has("lastHeartbeat") && !obj.Get("lastHeartbeat").IsNull()) {
            activation.lastHeartbeat = Clock::now();
        }
        return activation;
    }
}

Napi::Value Hello(const Napi::CallbackInfo& info) {
    return Napi::String::New(info.Env(), Example());
}

Napi::Value ListLicenses(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto licenses = LicenseManager().GetAllLicenses();
    Napi::Array jsLicenses = Napi::Array::New(env, licenses.size());

    for (size_t index = 0; index < licenses.size(); ++index) {
        jsLicenses[index] = LicenseToJS(env, licenses[index]);
    }

    return jsLicenses;
}

Napi::Value GetLicense(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "license key is required").ThrowAsJavaScriptException();
        return env.Null();
    }

    auto key = info[0].As<Napi::String>().Utf8Value();
    auto license = LicenseManager().GetLicense(key);
    if (!license.has_value()) {
        return env.Null();
    }

    return LicenseToJS(env, license.value());
}

Napi::Value Activate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "expected license key and activation payload").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    auto key = info[0].As<Napi::String>().Utf8Value();
    Activation activation = ActivationFromJS(info[1].As<Napi::Object>());
    auto success = LicenseManager().ActivateMachine(key, activation);
    return Napi::Boolean::New(env, success);
}

Napi::Value Deactivate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
        Napi::TypeError::New(env, "expected license key and machine id").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    auto key = info[0].As<Napi::String>().Utf8Value();
    auto machineId = info[1].As<Napi::String>().Utf8Value();
    auto success = LicenseManager().DeactivateMachine(key, machineId);
    return Napi::Boolean::New(env, success);
}

Napi::Value CheckExpiration(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "license key is required").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    auto key = info[0].As<Napi::String>().Utf8Value();
    auto expired = LicenseManager().CheckExpiration(key);
    return Napi::Boolean::New(env, expired);
}

Napi::Value RemainingDays(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "license key is required").ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }

    auto key = info[0].As<Napi::String>().Utf8Value();
    auto remaining = LicenseManager().GetRemainingDays(key);
    return Napi::Number::New(env, remaining);
}

Napi::Value LicenseStatusAsString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "license key is required").ThrowAsJavaScriptException();
        return env.Null();
    }

    auto key = info[0].As<Napi::String>().Utf8Value();
    auto status = LicenseManager().GetLicenseStatus(key);
    return Napi::String::New(env, ToString(status));
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("hello", Napi::Function::New(env, Hello));
    exports.Set("listLicenses", Napi::Function::New(env, ListLicenses));
    exports.Set("getLicense", Napi::Function::New(env, GetLicense));
    exports.Set("activate", Napi::Function::New(env, Activate));
    exports.Set("deactivate", Napi::Function::New(env, Deactivate));
    exports.Set("checkExpiration", Napi::Function::New(env, CheckExpiration));
    exports.Set("remainingDays", Napi::Function::New(env, RemainingDays));
    exports.Set("licenseStatus", Napi::Function::New(env, LicenseStatusAsString));
    return exports;
}

NODE_API_MODULE(addon, Init)

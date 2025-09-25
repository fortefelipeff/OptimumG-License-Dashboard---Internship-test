#include "ManageLicense.h"

#include <algorithm>
#include <chrono>
#include <stdexcept>

namespace {
    using Clock = std::chrono::system_clock;

    Activation MakeActivation(const std::string& machineId,
                              const std::string& activatedBy,
                              const Clock::time_point& activatedAt,
                              std::optional<Clock::time_point> lastHeartbeat = std::nullopt) {
        return Activation{machineId, activatedBy, activatedAt, lastHeartbeat};
    }

    std::chrono::system_clock::time_point DaysFromNow(int days) {
        return Clock::now() + std::chrono::hours(24 * days);
    }

    std::chrono::system_clock::time_point DaysAgo(int days) {
        return Clock::now() - std::chrono::hours(24 * days);
    }
}

LicenseRepository::LicenseRepository() = default;

std::vector<License> LicenseRepository::GetAll() const {
    std::vector<License> result;
    result.reserve(licenses_.size());
    for (const auto& pair : licenses_) {
        result.push_back(pair.second);
    }
    return result;
}

std::optional<License> LicenseRepository::Get(const std::string& licenseKey) const {
    auto it = licenses_.find(licenseKey);
    if (it == licenses_.end()) {
        return std::nullopt;
    }
    return it->second;
}

void LicenseRepository::Upsert(const License& license) {
    licenses_[license.key] = license;
}

ManageLicense::ManageLicense() {
    SeedMockData();
}

ManageLicense::~ManageLicense() = default;

bool ManageLicense::ActivateMachine(const std::string& licenseKey, const Activation& activation) {
    auto existing = repository_.Get(licenseKey);
    if (!existing.has_value()) {
        return false;
    }

    auto license = existing.value();
    auto now = std::chrono::system_clock::now();

    if (now >= license.expiresAt || DetermineStatus(license) == LicenseStatus::Revoked) {
        return false;
    }

    auto alreadyRegistered = std::find_if(license.activations.begin(), license.activations.end(),
                                          [&activation](const Activation& item) {
                                              return item.machineId == activation.machineId;
                                          });

    if (alreadyRegistered != license.activations.end()) {
        alreadyRegistered->lastHeartbeat = activation.lastHeartbeat;
        repository_.Upsert(license);
        return true;
    }

    if (static_cast<int>(license.activations.size()) >= license.activationLimit) {
        return false;
    }

    Activation newActivation = activation;
    newActivation.activatedAt = now;
    license.activations.push_back(newActivation);
    license.status = DetermineStatus(license);
    repository_.Upsert(license);
    return true;
}

bool ManageLicense::DeactivateMachine(const std::string& licenseKey, const std::string& machineId) {
    auto existing = repository_.Get(licenseKey);
    if (!existing.has_value()) {
        return false;
    }

    auto license = existing.value();
    auto previousSize = license.activations.size();
    license.activations.erase(
        std::remove_if(license.activations.begin(), license.activations.end(),
                       [&machineId](const Activation& item) { return item.machineId == machineId; }),
        license.activations.end());

    if (license.activations.size() == previousSize) {
        return false;
    }

    license.status = DetermineStatus(license);
    repository_.Upsert(license);
    return true;
}

std::vector<License> ManageLicense::GetAllLicenses() const {
    auto licenses = repository_.GetAll();
    for (auto& license : licenses) {
        auto updatedStatus = DetermineStatus(license);
        if (license.status != updatedStatus) {
            license.status = updatedStatus;
        }
    }
    return licenses;
}

std::optional<License> ManageLicense::GetLicense(const std::string& licenseKey) const {
    auto license = repository_.Get(licenseKey);
    if (!license.has_value()) {
        return std::nullopt;
    }

    auto resolved = license.value();
    resolved.status = DetermineStatus(resolved);
    return resolved;
}

bool ManageLicense::CheckExpiration(const std::string& licenseKey) const {
    auto license = repository_.Get(licenseKey);
    if (!license.has_value()) {
        return false;
    }

    return std::chrono::system_clock::now() >= license->expiresAt;
}

int ManageLicense::GetRemainingDays(const std::string& licenseKey) const {
    auto license = repository_.Get(licenseKey);
    if (!license.has_value()) {
        return -1;
    }

    auto now = std::chrono::system_clock::now();
    if (now >= license->expiresAt) {
        return 0;
    }

    auto remainingHours = std::chrono::duration_cast<std::chrono::hours>(license->expiresAt - now);
    return static_cast<int>(remainingHours.count() / 24);
}

LicenseStatus ManageLicense::GetLicenseStatus(const std::string& licenseKey) const {
    auto license = repository_.Get(licenseKey);
    if (!license.has_value()) {
        return LicenseStatus::Revoked;
    }

    return DetermineStatus(license.value());
}

void ManageLicense::SeedMockData() {
    auto now = std::chrono::system_clock::now();

    License proLicense{
        "OPT-PRO-001",
        "OptimumTire Pro",
        "Acme Racing",
        LicenseTier::Professional,
        LicenseStatus::Active,
        DaysAgo(45),
        DaysFromNow(120),
        3,
        {
            MakeActivation("ACME-RIG-01", "jane.doe", DaysAgo(30)),
            MakeActivation("ACME-RIG-02", "john.smith", DaysAgo(10))
        },
        "Primary license for aerodynamic analysis"
    };

    License trialLicense{
        "OPT-TRIAL-041",
        "OptimumLap",
        "Velocity Labs",
        LicenseTier::Trial,
        LicenseStatus::Pending,
        DaysAgo(5),
        DaysFromNow(10),
        1,
        {},
        "Trial awaiting first activation"
    };

    License expiredLicense{
        "OPT-STD-887",
        "OptimumG Suspension",
        "Apex Dynamics",
        LicenseTier::Standard,
        LicenseStatus::Expired,
        DaysAgo(200),
        DaysAgo(2),
        2,
        {
            MakeActivation("APEX-RIG-01", "rachel.lee", DaysAgo(150), DaysAgo(3))
        },
        "Expired license retained for audit"
    };

    repository_.Upsert(proLicense);
    repository_.Upsert(trialLicense);
    repository_.Upsert(expiredLicense);
}

LicenseStatus ManageLicense::DetermineStatus(const License& license) const {
    auto now = std::chrono::system_clock::now();

    if (license.status == LicenseStatus::Revoked) {
        return LicenseStatus::Revoked;
    }

    if (now >= license.expiresAt) {
        return LicenseStatus::Expired;
    }

    if (!license.activations.empty()) {
        return LicenseStatus::Active;
    }

    if (license.status == LicenseStatus::Pending) {
        return LicenseStatus::Pending;
    }

    return LicenseStatus::Inactive;
}

std::string Example() {
    return "Hello from ManageLicense";
}
